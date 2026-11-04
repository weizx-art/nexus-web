import { type BaseResponse } from '@/models/base'

export type UploadImageResponse = BaseResponse<{
  image_url: string
}>

export type UploadFileResponse = BaseResponse<{
  id: string
  name: string
  size: number
  extension: string
  mime_type: string
}>
