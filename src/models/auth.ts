import { type BaseResponse } from '@/models/base'

export type PasswordLoginResponse = BaseResponse<{
  access_token: string
  expire_at: number
}>

export type RegisterResponse = BaseResponse<{
  id: string
  username: string
  name: string
}>
