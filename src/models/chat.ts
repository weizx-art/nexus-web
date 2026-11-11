import { type BaseResponse } from '@/models/base'

export type RetrievalStrategy = 'semantic' | 'full_text' | 'hybrid'

export type ChatRequest = {
  message: string
  conversation_id?: string | null
  dataset_ids?: string[] | null
  retrieval_strategy?: RetrievalStrategy
  retrieval_k?: number
  retrieval_score?: number
}

export type ChatResponse = BaseResponse<{
  conversation_id: string
  message_id: string
  content: string
  context: Array<{
    content: string
    source: string
    score: number
  }> | null
  token_count: number
}>

export type Conversation = {
  id: string
  title: string
  message_count: number
  dataset_ids: string[]
  created_at: string
  updated_at: string | null
}

export type ConversationListResponse = BaseResponse<{
  items: Conversation[]
  paginator: {
    current_page: number
    page_size: number
    total: number
    total_pages: number
  }
}>

export type ChatMessage = {
  id: string
  conversation_id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  context: Array<{
    content: string
    source: string
    score: number
  }> | null
  token_count: number
  retrieval_strategy?: 'semantic' | 'full_text' | 'hybrid' | null
  retrieval_k?: number | null
  retrieval_score?: number | null
  created_at: string
}

export type MessageListResponse = BaseResponse<ChatMessage[]>

export type SSEEvent = {
  type: 'start' | 'token' | 'tool_call' | 'tool_result' | 'done' | 'error'
  content?: string
  conversation_id?: string
  tool?: string
  status?: string
}
