import { upload } from '@/utils/request'
import { type UploadFileResponse, type UploadImageResponse } from '@/models/upload-file'

export const uploadImage = (image: File) => {
  const formData = new FormData()
  formData.append('file', image)
  return upload<UploadImageResponse>(`/upload-files/image`, formData)
}

export const uploadFile = (file: File) => {
  const formData = new FormData()
  formData.append('file', file)
  return upload<UploadFileResponse>(`/upload-files/file`, formData)
}
