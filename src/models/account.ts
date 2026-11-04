import { type BaseResponse } from '@/models/base'

export type GetCurrentUserResponse = BaseResponse<{
  id: string
  name: string
  username: string
  avatar: string
  last_login_ip: string
  last_login_at: string
  created_at: string
}>
