import { ref } from 'vue'
import { defineStore } from 'pinia'
import storage from '@/utils/storage'

export interface Credential {
  access_token: string
  expire_at: number
}

const initCredential: Credential = {
  access_token: '',
  expire_at: 0,
}

export const useCredentialStore = defineStore('credential', () => {
  const credential = ref<Credential>(storage.get('credential', initCredential))

  const update = (params: Partial<Credential>) => {
    credential.value = { ...credential.value, ...params }
    storage.set('credential', credential.value)
  }

  const clear = () => {
    credential.value = { ...initCredential }
    storage.remove('credential')
  }

  return { credential, update, clear }
})
