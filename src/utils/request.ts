import { Message } from '@arco-design/web-vue'
import { apiPrefix, httpCode } from '@/config'
import { useCredentialStore } from '@/stores/credential'
import router from '@/router'

const DEFAULT_TIMEOUT = 30_000

function getAuthHeaders(): Record<string, string> {
  const { credential } = useCredentialStore()
  const headers: Record<string, string> = {}
  if (credential.access_token) {
    headers['Authorization'] = `Bearer ${credential.access_token}`
  }
  return headers
}

function handleUnauthorized() {
  const { clear } = useCredentialStore()
  clear()
  router.replace({ path: '/login' })
}

async function handleResponse<T>(response: Response): Promise<T> {
  const contentType = response.headers.get('content-type') || ''
  if (!contentType.includes('application/json')) {
    const text = await response.text()
    const msg = text || `请求失败 (${response.status})`
    Message.error(msg)
    throw new Error(msg)
  }
  const json = await response.json()
  if (json.code === httpCode.success) return json as T
  if (json.code === httpCode.unauthorized) {
    handleUnauthorized()
    throw new Error(json.message || '未授权')
  }
  Message.error(json.message || '请求失败')
  throw new Error(json.message || '请求失败')
}

type QueryParams = Record<string, string | number | boolean | undefined>

function buildUrl(path: string, params?: QueryParams): string {
  const url = `${apiPrefix}${path}`
  if (!params) return url
  const searchParams = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null) {
      searchParams.append(key, String(value))
    }
  }
  const qs = searchParams.toString()
  return qs ? `${url}?${qs}` : url
}

function request<T>(
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE',
  url: string,
  options?: { params?: QueryParams; body?: unknown; signal?: AbortSignal },
): Promise<T> {
  const { params, body, signal } = options ?? {}
  const headers: Record<string, string> = { ...getAuthHeaders() }
  if (body !== undefined) headers['Content-Type'] = 'application/json'

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT)

  return fetch(buildUrl(url, params), {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
    signal: signal ?? controller.signal,
  })
    .then(handleResponse<T>)
    .finally(() => clearTimeout(timeoutId))
}

export const get = <T>(url: string, params?: QueryParams) =>
  request<T>('GET', url, { params })

export const post = <T>(url: string, body?: unknown) =>
  request<T>('POST', url, { body })

export const patch = <T>(url: string, body?: unknown) =>
  request<T>('PATCH', url, { body })

export const del = <T>(url: string) =>
  request<T>('DELETE', url)

export const upload = <T>(
  url: string,
  data: FormData,
  onProgress?: (percent: number) => void,
): Promise<T> => {
  return fetch(buildUrl(url), {
    method: 'POST',
    headers: getAuthHeaders(),
    body: data,
  }).then((response) => {
    if (onProgress) {
      const total = Number(response.headers.get('Content-Length')) || 0
      if (total > 0) onProgress(100)
    }
    return handleResponse<T>(response)
  })
}

/**
 * SSE 流式请求，返回 AsyncGenerator 逐事件产出。
 * SSE 不使用默认超时，由调用方通过 signal 控制取消。
 */
export async function* sse<T = Record<string, unknown>>(
  url: string,
  data?: unknown,
  signal?: AbortSignal,
): AsyncGenerator<T> {
  let response: Response
  try {
    response = await fetch(buildUrl(url), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: data !== undefined ? JSON.stringify(data) : undefined,
      signal,
    })
  } catch (err: unknown) {
    if (err instanceof Error && err.name === 'AbortError') throw err
    throw new Error('无法连接到服务器', { cause: err })
  }

  if (!response.ok) {
    if (response.status === 401) {
      handleUnauthorized()
      throw new Error('未授权')
    }
    let errorMsg = `请求失败 (${response.status})`
    const contentType = response.headers.get('content-type') || ''
    if (contentType.includes('application/json')) {
      try {
        const body = await response.json()
        errorMsg = body.message || body.detail || errorMsg
      } catch {
        // ignore parse error
      }
    } else {
      const text = await response.text()
      if (text) errorMsg = text.slice(0, 200)
    }
    throw new Error(errorMsg)
  }

  const reader = response.body?.getReader()
  if (!reader) throw new Error('无法获取响应流')

  const decoder = new TextDecoder()
  let buffer = ''

  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() || ''

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const raw = line.slice(6).trim()
          if (!raw) continue
          try {
            yield JSON.parse(raw) as T
          } catch {
            // 跳过无法解析的行
          }
        }
      }
    }

    if (buffer.startsWith('data: ')) {
      const raw = buffer.slice(6).trim()
      if (raw) {
        try {
          yield JSON.parse(raw) as T
        } catch {
          // ignore
        }
      }
    }
  } finally {
    reader.releaseLock()
  }
}
