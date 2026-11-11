import { ref } from 'vue'
import { defineStore } from 'pinia'
import storage from '@/utils/storage'
import type { RetrievalStrategy } from '@/models/chat'

const ACTIVE_CONV_KEY = 'chat_active_conversation_id'
const SELECTED_DATASETS_KEY = 'chat_selected_dataset_ids'
const RETRIEVAL_STRATEGY_KEY = 'chat_retrieval_strategy'
const RETRIEVAL_K_KEY = 'chat_retrieval_k'
const RETRIEVAL_SCORE_KEY = 'chat_retrieval_score'

export const useChatStore = defineStore('chat', () => {
  const activeConversationId = ref<string | null>(storage.get(ACTIVE_CONV_KEY, null))
  const selectedDatasetIds = ref<string[]>(storage.get(SELECTED_DATASETS_KEY, []))
  const retrievalStrategy = ref<RetrievalStrategy>(
    storage.get<RetrievalStrategy>(RETRIEVAL_STRATEGY_KEY, 'semantic'),
  )
  const retrievalK = ref<number>(storage.get<number>(RETRIEVAL_K_KEY, 5))
  const retrievalScore = ref<number>(storage.get<number>(RETRIEVAL_SCORE_KEY, 0))

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

  const setRetrievalStrategy = (strategy: RetrievalStrategy) => {
    retrievalStrategy.value = strategy
    storage.set(RETRIEVAL_STRATEGY_KEY, strategy)
  }

  const setRetrievalK = (k: number) => {
    // 与后端 ChatReq.retrieval_k 的取值范围保持一致（1~10）
    const value = Math.min(10, Math.max(1, Math.round(k || 1)))
    retrievalK.value = value
    storage.set(RETRIEVAL_K_KEY, value)
  }

  const setRetrievalScore = (score: number) => {
    // 与后端 ChatReq.retrieval_score 的取值范围保持一致（0~0.99）
    const value = Math.min(0.99, Math.max(0, Number(score) || 0))
    retrievalScore.value = Number(value.toFixed(2))
    storage.set(RETRIEVAL_SCORE_KEY, retrievalScore.value)
  }

  const clear = () => {
    activeConversationId.value = null
    storage.remove(ACTIVE_CONV_KEY)
    // 知识库选择按会话记忆，由页面在新建/切换会话时更新
  }

  return {
    activeConversationId,
    selectedDatasetIds,
    retrievalStrategy,
    retrievalK,
    retrievalScore,
    setActive,
    setSelectedDatasets,
    setRetrievalStrategy,
    setRetrievalK,
    setRetrievalScore,
    clear,
  }
})
