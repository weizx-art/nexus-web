import { post } from '@/utils/request'
import { type BaseResponse } from '@/models/base'
import { type PasswordLoginResponse, type RegisterResponse } from '@/models/auth'

export const passwordLogin = (username: string, password: string) => {
  return post<PasswordLoginResponse>(`/auth/password-login`, { username, password })
}

export const register = (username: string, password: string, name?: string) => {
  return post<RegisterResponse>(`/auth/register`, { username, password, name })
}

export const logout = () => {
  return post<BaseResponse<null>>(`/auth/logout`)
}
