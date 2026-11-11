<script setup lang="ts">
import { ref, reactive, nextTick, computed, onMounted } from 'vue'
import { Message, Modal } from '@arco-design/web-vue'
import { useAccountStore } from '@/stores/account'
import { useChatStore } from '@/stores/chat'
import {
  getConversations,
  getConversationMessages,
  deleteConversation,
  updateConversationTitle,
  chatStream,
} from '@/services/chat'
import { getDatasetsWithPage } from '@/services/dataset'
import type { Conversation, RetrievalStrategy } from '@/models/chat'

interface DisplayMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  time: string
  context?: Array<{ content: string; source: string; score: number }> | null
  retrieval_strategy?: 'semantic' | 'full_text' | 'hybrid' | null
  retrieval_k?: number | null
  retrieval_score?: number | null
  streaming?: boolean
}

interface DatasetItem {
  id: string
  name: string
  document_count: number
}

const accountStore = useAccountStore()
const chatStore = useChatStore()

const conversations = reactive<Conversation[]>([])
const activeConversationId = computed({
  get: () => chatStore.activeConversationId,
  set: (val: string | null) => chatStore.setActive(val),
})
const conversationsLoading = ref(false)

const messages = reactive<DisplayMessage[]>([])
const inputMessage = ref('')
const sending = ref(false)
const messageContainer = ref<HTMLElement>()
const abortController = ref<AbortController | null>(null)
const inputRef = ref<HTMLInputElement>()

const datasets = reactive<DatasetItem[]>([])
const selectedDatasetIds = computed({
  get: () => chatStore.selectedDatasetIds,
  set: (val: string[]) => chatStore.setSelectedDatasets(val),
})
const showDatasetPicker = ref(false)
const datasetsLoading = ref(false)
const datasetSearch = ref('')

const retrievalStrategy = computed({
  get: () => chatStore.retrievalStrategy,
  set: (val: RetrievalStrategy) => chatStore.setRetrievalStrategy(val),
})

const retrievalK = computed({
  get: () => chatStore.retrievalK,
  set: (val: number | null) => chatStore.setRetrievalK(Number(val ?? 1)),
})

const retrievalScore = computed({
  get: () => chatStore.retrievalScore,
  set: (val: number | null) => chatStore.setRetrievalScore(Number(val ?? 0)),
})

const strategyOptions = [
  { label: '相似性检索', value: 'semantic' },
  { label: '全文检索', value: 'full_text' },
  { label: '混合策略', value: 'hybrid' },
]

const filteredDatasets = computed(() => {
  const kw = datasetSearch.value.trim().toLowerCase()
  if (!kw) return datasets
  return datasets.filter((d) => d.name.toLowerCase().includes(kw))
})

const editingConversationId = ref<string | null>(null)
const editingTitle = ref('')

const hasMessages = computed(() => messages.length > 0)
const selectedDatasets = computed(() =>
  datasets.filter((d) => selectedDatasetIds.value.includes(d.id)),
)

let _msgIdCounter = 0
const nextMsgId = () => `msg-${++_msgIdCounter}`

const formatTime = (dateStr?: string | null) => {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`
}

const strategyLabel = (strategy: 'semantic' | 'full_text' | 'hybrid') => {
  if (strategy === 'full_text') return '全文检索'
  if (strategy === 'hybrid') return '混合策略'
  return '相似性检索'
}

const scorePercent = (score: number) => {
  const value = Number(score) || 0
  return Math.max(4, Math.min(100, Math.round(value * 100)))
}

const nowTimeStr = () => {
  const d = new Date()
  return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`
}

const loadConversations = async () => {
  conversationsLoading.value = true
  try {
    const resp = await getConversations(1, 50)
    conversations.splice(0, conversations.length, ...resp.data.items)
    if (conversations.length === 0) {
      // 列表为空，清除可能存在的陈旧 ID 和知识库选择
      if (activeConversationId.value) {
        chatStore.clear()
      }
      if (selectedDatasetIds.value.length > 0) {
        selectedDatasetIds.value = []
      }
      return
    }
    // 如果当前选中的会话在列表中，加载其消息；否则加载第一个
    const activeId = activeConversationId.value
    const targetId =
      activeId && conversations.some((c) => c.id === activeId) ? activeId : conversations[0].id
    await selectConversation(targetId)
  } catch {
    Message.error('加载对话列表失败')
  } finally {
    conversationsLoading.value = false
  }
}

const loadDatasets = async () => {
  datasetsLoading.value = true
  try {
    const resp = await getDatasetsWithPage(1, 50)
    datasets.splice(0, datasets.length, ...resp.data.list)
    // 列表已加载完整时，清理已被删除的知识库 ID，避免角标计数残留
    if (resp.data.paginator.total_record <= datasets.length) {
      const validIds = new Set(datasets.map((d) => d.id))
      const kept = selectedDatasetIds.value.filter((id) => validIds.has(id))
      if (kept.length !== selectedDatasetIds.value.length) {
        selectedDatasetIds.value = kept
      }
    }
  } catch {
    Message.error('加载知识库列表失败')
  } finally {
    datasetsLoading.value = false
  }
}

const selectConversation = async (convId: string) => {
  activeConversationId.value = convId
  const conv = conversations.find((c) => c.id === convId)
  // 恢复该会话记住的知识库选择，过滤掉已被删除的知识库
  selectedDatasetIds.value = (conv?.dataset_ids ?? []).filter((id) =>
    datasets.some((d) => d.id === id),
  )
  messages.splice(0, messages.length)
  try {
    const resp = await getConversationMessages(convId)
    for (const msg of resp.data) {
      if (msg.role === 'user' || msg.role === 'assistant') {
        messages.push({
          id: msg.id || nextMsgId(),
          role: msg.role,
          content: msg.content,
          time: formatTime(msg.created_at),
          context: msg.context,
          retrieval_strategy: msg.retrieval_strategy ?? null,
          retrieval_k: msg.retrieval_k ?? null,
          retrieval_score: msg.retrieval_score ?? null,
        })
      }
    }
    await nextTick()
    scrollToBottom()
  } catch {
    Message.error('加载消息失败')
  }
}

const startNewChat = () => {
  chatStore.clear()
  selectedDatasetIds.value = []
  messages.splice(0, messages.length)
  inputMessage.value = ''
}

const handleDeleteConversation = (convId: string) => {
  Modal.warning({
    title: '删除对话',
    content: '确定要删除该对话及其所有消息记录吗？',
    hideCancel: false,
    onOk: async () => {
      try {
        await deleteConversation(convId)
        if (activeConversationId.value === convId) startNewChat()
        await loadConversations()
        Message.success('删除成功')
      } catch {
        Message.error('删除失败')
      }
    },
  })
}

const startEditTitle = (conv: Conversation) => {
  editingConversationId.value = conv.id
  editingTitle.value = conv.title
}

const saveEditTitle = async () => {
  if (!editingConversationId.value || !editingTitle.value.trim()) {
    editingConversationId.value = null
    return
  }
  try {
    await updateConversationTitle(editingConversationId.value, editingTitle.value.trim())
    const conv = conversations.find((c) => c.id === editingConversationId.value)
    if (conv) conv.title = editingTitle.value.trim()
    Message.success('标题已更新')
  } catch {
    Message.error('更新失败')
  }
  editingConversationId.value = null
}

const toggleDataset = (id: string) => {
  const ids = [...selectedDatasetIds.value]
  const idx = ids.indexOf(id)
  if (idx >= 0) ids.splice(idx, 1)
  else ids.push(id)
  selectedDatasetIds.value = ids
}

let _scrollTimer: ReturnType<typeof setTimeout> | null = null
const throttledScrollToBottom = () => {
  if (_scrollTimer) return
  _scrollTimer = setTimeout(() => {
    scrollToBottom()
    _scrollTimer = null
  }, 80)
}

const handleSend = async () => {
  const text = inputMessage.value.trim()
  if (!text || sending.value) return

  messages.push({ id: nextMsgId(), role: 'user', content: text, time: nowTimeStr() })
  inputMessage.value = ''
  sending.value = true
  await nextTick()
  scrollToBottom()

  messages.push({
    id: nextMsgId(),
    role: 'assistant',
    content: '',
    time: '',
    streaming: true,
  })
  const assistantMsgIndex = messages.length - 1
  await nextTick()
  scrollToBottom()

  abortController.value = new AbortController()

  try {
    const gen = chatStream(
      {
        message: text,
        conversation_id: activeConversationId.value,
        dataset_ids: selectedDatasetIds.value.length > 0 ? selectedDatasetIds.value : null,
        retrieval_strategy: retrievalStrategy.value,
        retrieval_k: retrievalK.value,
        retrieval_score: retrievalScore.value,
      },
      abortController.value.signal,
    )

    for await (const event of gen) {
      switch (event.type) {
        case 'start':
          if (event.conversation_id) {
            chatStore.setActive(event.conversation_id)
          }
          break
        case 'token':
          messages[assistantMsgIndex].content += event.content || ''
          throttledScrollToBottom()
          break
        case 'done':
          messages[assistantMsgIndex].streaming = false
          messages[assistantMsgIndex].time = nowTimeStr()
          break
        case 'error':
          messages[assistantMsgIndex].content = event.content || '对话出错，请重试'
          messages[assistantMsgIndex].streaming = false
          messages[assistantMsgIndex].time = nowTimeStr()
          Message.error(event.content || '对话出错')
          break
      }
    }

    messages[assistantMsgIndex].streaming = false
    if (!messages[assistantMsgIndex].time) messages[assistantMsgIndex].time = nowTimeStr()
    await loadConversations()
  } catch (err: unknown) {
    if (err instanceof Error && err.name === 'AbortError') {
      messages[assistantMsgIndex].streaming = false
      messages[assistantMsgIndex].time = nowTimeStr()
      if (!messages[assistantMsgIndex].content) messages[assistantMsgIndex].content = '已停止生成'
    } else {
      messages[assistantMsgIndex].streaming = false
      messages[assistantMsgIndex].content = err instanceof Error ? err.message : '请求失败'
      messages[assistantMsgIndex].time = nowTimeStr()
    }
  } finally {
    sending.value = false
    abortController.value = null
    await nextTick()
    inputRef.value?.focus()
  }
}

const handleStop = () => {
  abortController.value?.abort()
}

const scrollToBottom = () => {
  if (messageContainer.value) {
    messageContainer.value.scrollTop = messageContainer.value.scrollHeight
  }
}

const handleKeyDown = (e: KeyboardEvent) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    handleSend()
  }
}

onMounted(async () => {
  // 先加载知识库列表，再加载会话并恢复其知识库选择
  await loadDatasets()
  await loadConversations()
})
</script>

<template>
  <div class="h-full flex overflow-hidden">
    <!-- 左侧：对话列表 -->
    <div class="w-64 flex-shrink-0 bg-gray-50/80 border-r border-gray-200 flex flex-col">
      <div class="p-3 border-b border-gray-200">
        <a-button type="primary" long class="!rounded-xl" @click="startNewChat">
          <template #icon><icon-plus /></template>
          新建对话
        </a-button>
      </div>
      <div class="flex-1 overflow-y-auto p-2 space-y-1">
        <div v-if="conversationsLoading" class="flex justify-center py-8">
          <a-spin :size="20" />
        </div>
        <div
          v-for="conv in conversations"
          :key="conv.id"
          class="group flex items-center gap-2 px-3 py-2.5 rounded-xl cursor-pointer transition-all text-sm"
          :class="
            activeConversationId === conv.id
              ? 'bg-blue-50 text-blue-700 font-medium'
              : 'text-gray-600 hover:bg-gray-100'
          "
          @click="selectConversation(conv.id)"
        >
          <icon-message class="flex-shrink-0" :size="14" />
          <template v-if="editingConversationId === conv.id">
            <input
              v-model="editingTitle"
              class="flex-1 min-w-0 bg-white border border-blue-300 rounded px-1.5 py-0.5 text-sm outline-none"
              autofocus
              @keydown.enter="saveEditTitle"
              @keydown.escape="editingConversationId = null"
              @blur="saveEditTitle"
              @click.stop
            />
          </template>
          <template v-else>
            <span class="flex-1 truncate">{{ conv.title }}</span>
            <div
              class="flex-shrink-0 flex items-center gap-0.5 w-0 group-hover:w-12 overflow-hidden transition-all duration-200 ease-in-out"
            >
              <a-tooltip content="重命名">
                <a-button
                  type="text"
                  size="mini"
                  class="!p-0.5 !text-gray-400 hover:!text-blue-500"
                  @click.stop="startEditTitle(conv)"
                >
                  <template #icon><icon-edit :size="12" /></template>
                </a-button>
              </a-tooltip>
              <a-tooltip content="删除">
                <a-button
                  type="text"
                  size="mini"
                  class="!p-0.5 !text-gray-400 hover:!text-red-500"
                  @click.stop="handleDeleteConversation(conv.id)"
                >
                  <template #icon><icon-delete :size="12" /></template>
                </a-button>
              </a-tooltip>
            </div>
          </template>
        </div>
        <div
          v-if="!conversationsLoading && conversations.length === 0"
          class="text-center text-gray-400 text-xs py-8"
        >
          暂无对话记录
        </div>
      </div>
    </div>

    <!-- 右侧：聊天主区域 -->
    <div class="flex-1 flex flex-col min-w-0">
      <!-- 顶部栏 -->
      <div class="flex-shrink-0 px-6 pb-3">
        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-lg font-bold text-gray-900">
              {{
                activeConversationId
                  ? conversations.find((c) => c.id === activeConversationId)?.title || '智能对话'
                  : '智能对话'
              }}
            </h1>
            <p class="text-xs text-gray-400 mt-0.5">基于知识库的智能问答，支持多轮对话与流式输出</p>
          </div>
          <div class="flex items-center gap-2">
            <a-select
              v-model="retrievalStrategy"
              :options="strategyOptions"
              size="small"
              :style="{ width: '128px' }"
              :disabled="selectedDatasetIds.length === 0"
              :title="
                selectedDatasetIds.length === 0 ? '选择知识库后可设置检索方式' : '知识库检索方式'
              "
            />
            <a-popover trigger="click" position="br" :disabled="selectedDatasetIds.length === 0">
              <a-button
                type="text"
                size="small"
                :disabled="selectedDatasetIds.length === 0"
                title="检索设置"
              >
                <template #icon><icon-settings :size="15" /></template>
              </a-button>
              <template #content>
                <div class="w-72">
                  <div class="text-sm font-medium text-gray-700 mb-3">检索设置</div>
                  <div class="flex items-center justify-between text-xs text-gray-500 mb-1">
                    <span>最大召回数量</span>
                    <span class="text-gray-400">1 - 10</span>
                  </div>
                  <div class="flex items-center gap-3 mb-4">
                    <a-slider v-model:model-value="retrievalK" :step="1" :min="1" :max="10" />
                    <a-input-number
                      v-model:model-value="retrievalK"
                      class="w-[72px]"
                      :min="1"
                      :max="10"
                    />
                  </div>
                  <div class="flex items-center justify-between text-xs text-gray-500 mb-1">
                    <span>最小匹配度</span>
                    <span class="text-gray-400">0 - 0.99</span>
                  </div>
                  <div class="flex items-center gap-3">
                    <a-slider
                      v-model:model-value="retrievalScore"
                      :step="0.01"
                      :min="0"
                      :max="0.99"
                    />
                    <a-input-number
                      v-model:model-value="retrievalScore"
                      class="w-[72px]"
                      :min="0"
                      :max="0.99"
                      :step="0.01"
                      :precision="2"
                    />
                  </div>
                  <div class="text-xs text-gray-400 mt-3 leading-relaxed">
                    召回数量越大，上下文越全；匹配度越高越精准，设得过高可能检索不到内容。
                  </div>
                </div>
              </template>
            </a-popover>
            <a-popover
              trigger="click"
              position="br"
              :popup-visible="showDatasetPicker"
              @popup-visible-change="
                (v: boolean) => {
                  showDatasetPicker = v
                  if (!v) datasetSearch = ''
                }
              "
            >
            <a-button type="outline" size="small" class="!rounded-lg">
              <template #icon><icon-book :size="14" /></template>
              知识库
              <a-badge
                v-if="selectedDatasetIds.length > 0"
                :count="selectedDatasetIds.length"
                class="ml-1"
              />
            </a-button>
            <template #content>
              <div class="w-64">
                <div class="text-sm font-medium text-gray-700 mb-2">选择关联知识库</div>
                <div class="mb-2">
                  <a-input-search
                    v-model="datasetSearch"
                    placeholder="搜索知识库"
                    allow-clear
                    size="small"
                    class="!rounded-lg"
                  />
                </div>
                <div v-if="datasetsLoading" class="flex justify-center py-4">
                  <a-spin :size="16" />
                </div>
                <div
                  v-else-if="filteredDatasets.length === 0"
                  class="text-xs text-gray-400 py-4 text-center"
                >
                  {{ datasets.length === 0 ? '暂无知识库，请先在知识库页面创建' : '无匹配结果' }}
                </div>
                <div v-else class="space-y-1 max-h-48 overflow-y-auto">
                  <label
                    v-for="ds in filteredDatasets"
                    :key="ds.id"
                    class="flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                  >
                    <a-checkbox
                      :model-value="selectedDatasetIds.includes(ds.id)"
                      @change="toggleDataset(ds.id)"
                    />
                    <span class="text-sm text-gray-700 truncate flex-1">{{ ds.name }}</span>
                    <span class="text-xs text-gray-400">{{ ds.document_count }}篇</span>
                  </label>
                </div>
                <div
                  v-if="selectedDatasetIds.length > 0"
                  class="mt-2 pt-2 border-t border-gray-100 flex gap-1 flex-wrap"
                >
                  <a-tag
                    v-for="ds in selectedDatasets"
                    :key="ds.id"
                    closable
                    size="small"
                    color="blue"
                    @close="toggleDataset(ds.id)"
                  >
                    {{ ds.name }}
                  </a-tag>
                </div>
              </div>
            </template>
            </a-popover>
          </div>
        </div>
      </div>

      <!-- 消息区域 -->
      <div
        ref="messageContainer"
        class="flex-1 overflow-y-auto px-6 scrollbar-w-none bg-gray-50/30"
      >
        <!-- 空状态 -->
        <div v-if="!hasMessages" class="flex flex-col items-center justify-center h-full py-12">
          <div
            class="w-16 h-16 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-2xl flex items-center justify-center mb-4"
          >
            <icon-robot class="text-blue-500" :size="28" />
          </div>
          <h2 class="text-base font-semibold text-gray-700 mb-1">开始对话</h2>
          <p class="text-sm text-gray-400 mb-6">输入问题，或选择知识库进行精准问答</p>
          <div
            v-if="selectedDatasetIds.length > 0"
            class="flex gap-2 flex-wrap justify-center mb-4"
          >
            <a-tag v-for="ds in selectedDatasets" :key="ds.id" color="arcoblue" size="small">
              <icon-book :size="12" class="mr-1" />{{ ds.name }}
            </a-tag>
          </div>
        </div>

        <!-- 消息列表 -->
        <div v-else class="py-2 pb-4">
          <div v-for="msg in messages" :key="msg.id" class="mb-5">
            <!-- 用户消息 -->
            <div v-if="msg.role === 'user'" class="flex gap-3 justify-end">
              <div class="flex flex-col items-end gap-1.5 max-w-[70%]">
                <div class="flex items-center gap-2">
                  <span class="text-xs text-gray-400">{{ msg.time }}</span>
                  <span class="text-sm font-medium text-gray-700">{{
                    accountStore.account.name
                  }}</span>
                </div>
                <div
                  class="bg-blue-600 text-white px-4 py-3 rounded-2xl rounded-tr-md break-all text-sm leading-relaxed"
                >
                  {{ msg.content }}
                </div>
              </div>
              <a-avatar
                :size="34"
                shape="circle"
                class="flex-shrink-0 mt-5"
                :image-url="accountStore.account.avatar"
              />
            </div>
            <!-- AI 消息 -->
            <div v-else class="flex gap-3">
              <a-avatar
                :size="34"
                shape="circle"
                class="flex-shrink-0 mt-5 bg-gradient-to-br from-blue-500 to-indigo-600 shadow-md shadow-blue-200/50"
              >
                <icon-robot :size="18" />
              </a-avatar>
              <div class="flex flex-col items-start gap-1.5 max-w-[70%]">
                <div class="flex items-center gap-2">
                  <span class="text-sm font-medium text-gray-700">综合业务智能Agent</span>
                  <span class="text-xs text-gray-400">{{ msg.time }}</span>
                </div>
                <div
                  class="bg-white border border-gray-200 px-4 py-3 rounded-2xl rounded-tl-md break-all text-sm leading-relaxed text-gray-700 shadow-sm"
                >
                  <div v-if="msg.streaming && !msg.content" class="flex gap-1.5 py-1">
                    <div
                      class="w-2 h-2 bg-blue-400 rounded-full animate-bounce"
                      style="animation-delay: 0ms"
                    />
                    <div
                      class="w-2 h-2 bg-blue-400 rounded-full animate-bounce"
                      style="animation-delay: 150ms"
                    />
                    <div
                      class="w-2 h-2 bg-blue-400 rounded-full animate-bounce"
                      style="animation-delay: 300ms"
                    />
                  </div>
                  <template v-else>
                    <div class="whitespace-pre-wrap">{{ msg.content }}</div>
                    <span
                      v-if="msg.streaming"
                      class="inline-block w-1.5 h-4 bg-blue-500 ml-0.5 animate-pulse align-text-bottom"
                    />
                  </template>
                </div>
                <!-- 知识库引用 -->
                <div
                  v-if="msg.context && msg.context.length > 0 && !msg.streaming"
                  class="mt-1.5 w-full"
                >
                  <a-collapse class="citation-collapse" :default-active-key="[]" :bordered="false">
                    <a-collapse-item key="ref" :show-expand-icon="true">
                      <template #header>
                        <div class="flex w-full items-center justify-between gap-3">
                          <span class="flex items-center gap-1.5 text-xs text-gray-500">
                            <icon-book :size="12" class="text-gray-400" />
                            <span class="font-medium text-gray-600">引用来源</span>
                            <span class="text-[11px] text-slate-400">{{ msg.context!.length }} 条</span>
                          </span>
                          <span v-if="msg.retrieval_strategy" class="truncate text-[11px] text-gray-400">
                            {{ strategyLabel(msg.retrieval_strategy) }}<template v-if="msg.retrieval_k != null"> · k={{ msg.retrieval_k }} · 阈值 {{ msg.retrieval_score ?? 0 }}</template>
                          </span>
                        </div>
                      </template>
                      <div class="divide-y divide-slate-200/70">
                        <div
                          v-for="(ctx, ci) in msg.context"
                          :key="ci"
                          class="flex items-start gap-2.5 py-2.5 first:pt-1 last:pb-1"
                        >
                          <span class="pt-0.5 text-[10px] font-semibold tabular-nums text-slate-400">
                            {{ String(ci + 1).padStart(2, '0') }}
                          </span>
                          <div class="min-w-0 flex-1">
                            <div class="flex items-baseline justify-between gap-3">
                              <span class="truncate text-xs font-medium text-gray-700">{{ ctx.source }}</span>
                              <span class="flex-shrink-0 text-[11px] font-medium tabular-nums text-blue-600/80">{{ scorePercent(ctx.score) }}%</span>
                            </div>
                            <div class="mt-1.5 h-[3px] w-full overflow-hidden rounded-full bg-slate-200/70">
                              <div
                                class="h-full rounded-full bg-gradient-to-r from-sky-400 to-blue-500 transition-all"
                                :style="{ width: scorePercent(ctx.score) + '%' }"
                              />
                            </div>
                            <p class="mt-1.5 line-clamp-3 text-[11px] leading-relaxed text-gray-500">{{ ctx.content }}</p>
                          </div>
                        </div>
                      </div>
                    </a-collapse-item>
                  </a-collapse>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 输入区域 -->
      <div
        class="flex-shrink-0 px-6 pb-5 pt-3 bg-white/80 backdrop-blur-sm border-t border-gray-100"
      >
        <div v-if="selectedDatasetIds.length > 0" class="flex gap-1.5 mb-2 flex-wrap">
          <a-tag
            v-for="ds in selectedDatasets"
            :key="ds.id"
            size="small"
            color="arcoblue"
            closable
            @close="toggleDataset(ds.id)"
          >
            <icon-book :size="10" class="mr-0.5" />{{ ds.name }}
          </a-tag>
        </div>
        <div class="flex items-center gap-3">
          <div
            class="h-12 flex items-center gap-2 px-4 flex-1 bg-gray-50 border border-gray-200 rounded-2xl focus-within:border-blue-400 focus-within:bg-white focus-within:shadow-sm transition-all"
          >
            <icon-edit class="text-gray-300" :size="16" />
            <input
              ref="inputRef"
              v-model="inputMessage"
              type="text"
              class="flex-1 outline-0 bg-transparent text-sm text-gray-700 placeholder-gray-400"
              placeholder="输入消息，或描述你需要完成的任务..."
              :disabled="sending"
              @keydown="handleKeyDown"
            />
            <a-button
              v-if="sending"
              type="primary"
              status="danger"
              shape="circle"
              size="small"
              @click="handleStop"
            >
              <template #icon><icon-record-stop :size="14" /></template>
            </a-button>
            <a-button
              v-else
              type="primary"
              shape="circle"
              size="small"
              :disabled="!inputMessage.trim()"
              @click="handleSend"
            >
              <template #icon><icon-send :size="14" /></template>
            </a-button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
:deep(.citation-collapse .arco-collapse-item) {
  border-radius: 12px;
  overflow: hidden;
  background: #f7f9fc;
  border: 1px solid #e3e8ef;
}

:deep(.citation-collapse .arco-collapse-item-header) {
  background: transparent;
  border: 0;
  padding: 7px 12px 7px 34px;
  transition: background 0.15s ease;
}

:deep(.citation-collapse .arco-collapse-item-header-title) {
  flex: 1;
  min-width: 0;
}


:deep(.citation-collapse .arco-collapse-item-header:hover) {
  background: #f1f4f8;
}

:deep(.citation-collapse .arco-collapse-item-active > .arco-collapse-item-header) {
  border-bottom: 1px solid #eef1f5;
}

:deep(.citation-collapse .arco-collapse-item-content) {
  background: transparent;
  padding: 0;
}

:deep(.citation-collapse .arco-collapse-item-content-box) {
  padding: 2px 12px 6px;
}
</style>
