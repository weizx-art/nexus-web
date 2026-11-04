import { ref } from 'vue'
import { defineStore } from 'pinia'
import storage from '@/utils/storage'

const ACTIVE_CONV_KEY = 'chat_active_conversation_id'

export const useChatStore = defineStore('chat', () => {
  const activeConversationId = ref<string | null>(storage.get(ACTIVE_CONV_KEY, null))

  const setActive = (id: string | null) => {
    activeConversationId.value = id
    if (id) storage.set(ACTIVE_CONV_KEY, id)
    else storage.remove(ACTIVE_CONV_KEY)
  }

  const clear = () => {
    activeConversationId.value = null
    storage.remove(ACTIVE_CONV_KEY)
  }

  return { activeConversationId, setActive, clear }
})
