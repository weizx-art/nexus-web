import { get, patch } from '@/utils/request'
import { type BaseResponse } from '@/models/base'
import { type GetCurrentUserResponse } from '@/models/account'

export const getCurrentUser = () => {
  return get<GetCurrentUserResponse>(`/account`)
}

export const updateAccount = (data: { name?: string; avatar?: string; password?: string }) => {
  return patch<BaseResponse<null>>(`/account`, data)
}
