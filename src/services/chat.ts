import { get, post, patch, del, sse } from '@/utils/request'
import type {
  ChatRequest,
  ChatResponse,
  ConversationListResponse,
  MessageListResponse,
  SSEEvent,
} from '@/models/chat'
import type { BaseResponse } from '@/models/base'

export const getConversations = () => {
  return get<ConversationListResponse>(`/chat/conversations`)
}

export const getConversationMessages = (conversation_id: string) => {
  return get<MessageListResponse>(`/chat/conversations/${conversation_id}`)
}

export const updateConversationTitle = (conversation_id: string, title: string) => {
  return patch<BaseResponse<null>>(`/chat/conversations/${conversation_id}`, { title })
}

export const deleteConversation = (conversation_id: string) => {
  return del<BaseResponse<null>>(`/chat/conversations/${conversation_id}`)
}

export const chat = (req: ChatRequest) => {
  return post<ChatResponse>(`/chat/completions`, req)
}

export const chatStream = (req: ChatRequest, signal?: AbortSignal) => {
  return sse<SSEEvent>(`/chat/completions/stream`, req, signal)
}
