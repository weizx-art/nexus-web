import { type BasePaginatorResponse, type BaseResponse } from '@/models/base'

export type GetDatasetsWithPageResponse = BasePaginatorResponse<{
  id: string
  name: string
  icon: string
  description: string
  document_count: number
  hit_count: number
  character_count: number
  created_at: string
  updated_at: string | null
}>

export type CreateDatasetRequest = {
  name: string
  icon?: string
  description?: string
}

export type UpdateDatasetRequest = {
  name?: string
  icon?: string
  description?: string
}

export type GetDatasetResponse = BaseResponse<{
  id: string
  icon: string
  name: string
  description: string
  document_count: number
  hit_count: number
  character_count: number
  created_at: string
  updated_at: string | null
}>

export type GetDocumentsWithPageRequest = {
  current_page: number
  page_size: number
  search?: string
}

export type GetDocumentsWithPageResponse = BasePaginatorResponse<{
  id: string
  dataset_id: string
  name: string
  position: number
  character_count: number
  token_count: number
  enabled: boolean
  disabled_at: string | null
  status: string
  error: string
  segment_count: number
  hit_count: number
  created_at: string
  updated_at: string | null
}>

export type GetDocumentResponse = BaseResponse<{
  id: string
  dataset_id: string
  name: string
  segment_count: number
  character_count: number
  token_count: number
  hit_count: number
  position: number
  enabled: boolean
  disabled_at: string | null
  status: string
  error: string
  created_at: string
  updated_at: string | null
}>

export type RetrievalRequest = {
  query: string
  retrieval_strategy: 'semantic' | 'full_text' | 'hybrid'
  k: number
  score: number
}

export type RetrievalResponse = BaseResponse<
  Array<{
    id: string
    document_id: string
    dataset_id: string
    position: number
    content: string
    keywords: string[]
    character_count: number
    token_count: number
    hit_count: number
    score: number
    enabled: boolean
    status: string
    error: string
    created_at: string
    updated_at: string | null
    document: {
      id: string
      name: string
    }
  }>
>

export type GetDatasetQueriesResponse = BaseResponse<
  Array<{
    query: string
    created_at: string
  }>
>

export type CreateDocumentsRequest = {
  upload_file_ids: string[]
  process_type: 'automatic' | 'custom'
  rule?: {
    pre_process_rules: { id: string; enabled: boolean }[]
    segment: {
      separators: string[]
      chunk_size: number
      chunk_overlap: number
    }
  }
}

export type CreateDocumentsResponse = BaseResponse<{
  batch: string
  documents: string[]
}>

export type GetDocumentsStatusResponse = BaseResponse<
  Array<{
    id: string
    name: string
    status: string
    enabled: boolean
    error: string
    processing_started_at: string | null
    parsing_completed_at: string | null
    splitting_completed_at: string | null
    indexing_completed_at: string | null
    completed_at: string | null
    stopped_at: string | null
    created_at: string | null
  }>
>

export type GetSegmentsWithPageRequest = {
  current_page: number
  page_size: number
  search?: string
}

export type GetSegmentsWithPageResponse = BasePaginatorResponse<{
  id: string
  document_id: string
  dataset_id: string
  position: number
  content: string
  keywords: string[]
  character_count: number
  token_count: number
  hit_count: number
  hash: string
  enabled: boolean
  disabled_at: string | null
  status: string
  error: string
  created_at: string
  updated_at: string | null
}>

export type CreateSegmentRequest = {
  content: string
  keywords?: string[]
}

export type UpdateSegmentRequest = {
  content?: string
  keywords?: string[]
  enabled?: boolean
}

export type GetSegmentResponse = BaseResponse<{
  id: string
  document_id: string
  dataset_id: string
  position: number
  content: string
  keywords: string[]
  character_count: number
  token_count: number
  hit_count: number
  hash: string
  enabled: boolean
  status: string
  error: string
  created_at: string
  updated_at: string | null
}>
