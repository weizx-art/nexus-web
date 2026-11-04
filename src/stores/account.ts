import { ref } from 'vue'
import { defineStore } from 'pinia'
import storage from '@/utils/storage'

export interface Account {
  id: string
  name: string
  username: string
  avatar: string
  last_login_ip: string
  last_login_at: string
  created_at: string
}

const getAvatar = (id?: string) =>
  id ? `https://picsum.photos/seed/${id}/400/400` : `https://picsum.photos/400/400`

const initAccount: Account = {
  id: '',
  name: '',
  username: '',
  avatar: getAvatar(),
  last_login_ip: '',
  last_login_at: '',
  created_at: '',
}

export const useAccountStore = defineStore('account', () => {
  const account = ref<Account>(storage.get('account', { ...initAccount, avatar: getAvatar() }))

  const update = (params: Partial<Account>) => {
    if (!params.avatar) {
      params.avatar = account.value.avatar || getAvatar(params.id)
    }
    account.value = { ...initAccount, ...params }
    storage.set('account', account.value)
  }

  const clear = () => {
    account.value = { ...initAccount, avatar: getAvatar() }
    storage.remove('account')
  }

  return { account, update, clear }
})
