import { ref } from 'vue'
import { defineStore } from 'pinia'
import storage from '@/utils/storage'

const ACTIVE_CONV_KEY = 'chat_active_conversation_id'
const SELECTED_DATASETS_KEY = 'chat_selected_dataset_ids'

export const useChatStore = defineStore('chat', () => {
  const activeConversationId = ref<string | null>(storage.get(ACTIVE_CONV_KEY, null))
  const selectedDatasetIds = ref<string[]>(storage.get(SELECTED_DATASETS_KEY, []))

  const setActive = (id: string | null) => {
    activeConversationId.value = id
    if (id) storage.set(ACTIVE_CONV_KEY, id)
    else storage.remove(ACTIVE_CONV_KEY)
  }

  const setSelectedDatasets = (ids: string[]) => {
    selectedDatasetIds.value = ids
    if (ids.length > 0) storage.set(SELECTED_DATASETS_KEY, ids)
    else storage.remove(SELECTED_DATASETS_KEY)
  }

  const clear = () => {
    activeConversationId.value = null
    storage.remove(ACTIVE_CONV_KEY)
    // 不清除知识库选择，保留用户偏好
  }

  return { activeConversationId, selectedDatasetIds, setActive, setSelectedDatasets, clear }
})
