import { get, post, patch, del } from '@/utils/request'
import {
  type CreateDatasetRequest,
  type CreateDocumentsRequest,
  type CreateDocumentsResponse,
  type CreateSegmentRequest,
  type GetDatasetQueriesResponse,
  type GetDatasetResponse,
  type GetDatasetsWithPageResponse,
  type GetDocumentResponse,
  type GetDocumentsStatusResponse,
  type GetDocumentsWithPageRequest,
  type GetDocumentsWithPageResponse,
  type GetSegmentResponse,
  type GetSegmentsWithPageRequest,
  type GetSegmentsWithPageResponse,
  type RetrievalRequest,
  type RetrievalResponse,
  type UpdateDatasetRequest,
  type UpdateSegmentRequest,
} from '@/models/dataset'
import { type BaseResponse } from '@/models/base'

export const getDatasetsWithPage = (
  current_page: number = 1,
  page_size: number = 20,
  search: string = '',
) => {
  return get<GetDatasetsWithPageResponse>(`/datasets`, { current_page, page_size, search })
}

export const createDataset = (req: CreateDatasetRequest) => {
  return post<BaseResponse<{ id: string }>>(`/datasets`, req)
}

export const updateDataset = (dataset_id: string, req: UpdateDatasetRequest) => {
  return patch<BaseResponse<null>>(`/datasets/${dataset_id}`, req)
}

export const deleteDataset = (dataset_id: string) => {
  return del<BaseResponse<null>>(`/datasets/${dataset_id}`)
}

export const getDataset = (dataset_id: string) => {
  return get<GetDatasetResponse>(`/datasets/${dataset_id}`)
}

export const getDocumentsWithPage = (
  dataset_id: string,
  req: GetDocumentsWithPageRequest = { current_page: 1, page_size: 20 },
) => {
  return get<GetDocumentsWithPageResponse>(`/datasets/${dataset_id}/documents`, req)
}

export const getDocument = (dataset_id: string, document_id: string) => {
  return get<GetDocumentResponse>(`/datasets/${dataset_id}/documents/${document_id}`)
}

export const updateDocument = (
  dataset_id: string,
  document_id: string,
  data: { name?: string; enabled?: boolean },
) => {
  return patch<BaseResponse<null>>(`/datasets/${dataset_id}/documents/${document_id}`, data)
}

export const deleteDocument = (dataset_id: string, document_id: string) => {
  return del<BaseResponse<null>>(`/datasets/${dataset_id}/documents/${document_id}`)
}

export const retrieval = (dataset_id: string, req: RetrievalRequest) => {
  return post<RetrievalResponse>(`/datasets/${dataset_id}/retrieval`, req)
}

export const getDatasetQueries = (dataset_id: string) => {
  return get<GetDatasetQueriesResponse>(`/datasets/${dataset_id}/queries`)
}

export const createDocuments = (dataset_id: string, req: CreateDocumentsRequest) => {
  return post<CreateDocumentsResponse>(`/datasets/${dataset_id}/documents`, req)
}

export const getDocumentsStatus = (dataset_id: string, batch: string) => {
  return get<GetDocumentsStatusResponse>(`/datasets/${dataset_id}/documents/batch/${batch}`)
}

export const getSegmentsWithPage = (
  dataset_id: string,
  document_id: string,
  req: GetSegmentsWithPageRequest,
) => {
  return get<GetSegmentsWithPageResponse>(
    `/datasets/${dataset_id}/documents/${document_id}/segments`,
    req,
  )
}

export const createSegment = (
  dataset_id: string,
  document_id: string,
  req: CreateSegmentRequest,
) => {
  return post<BaseResponse<null>>(`/datasets/${dataset_id}/documents/${document_id}/segments`, req)
}

export const deleteSegment = (dataset_id: string, document_id: string, segment_id: string) => {
  return del<BaseResponse<null>>(
    `/datasets/${dataset_id}/documents/${document_id}/segments/${segment_id}`,
  )
}

export const updateSegment = (
  dataset_id: string,
  document_id: string,
  segment_id: string,
  req: UpdateSegmentRequest,
) => {
  return patch<BaseResponse<null>>(
    `/datasets/${dataset_id}/documents/${document_id}/segments/${segment_id}`,
    req,
  )
}

export const getSegment = (dataset_id: string, document_id: string, segment_id: string) => {
  return get<GetSegmentResponse>(
    `/datasets/${dataset_id}/documents/${document_id}/segments/${segment_id}`,
  )
}
