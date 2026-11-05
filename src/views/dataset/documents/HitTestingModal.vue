<script setup lang="ts">
import { reactive, ref, watch } from 'vue'
import dayjs from 'dayjs'
import { getDatasetQueries, retrieval } from '@/services/dataset'
import { Message } from '@arco-design/web-vue'
import type { RetrievalResponse, GetDatasetQueriesResponse } from '@/models/dataset'
import BaseModal from '@/components/BaseModal/BaseModal.vue'

type QueryItem = GetDatasetQueriesResponse['data'][number]
type RetrievalSegment = RetrievalResponse['data'][number]

const props = defineProps({
  visible: { type: Boolean, required: true },
  dataset_id: { type: String, required: true },
})
const emits = defineEmits(['update:visible'])

const queriesLoading = ref(false)
const queries = reactive<QueryItem[]>([])
const loadQueries = async () => {
  try {
    queriesLoading.value = true
    const resp = await getDatasetQueries(props.dataset_id)
    queries.splice(0, queries.length, ...resp.data)
  } finally {
    queriesLoading.value = false
  }
}

const retrievalSettingModalVisible = ref(false)
const defaultRetrievalSetting = {
  retrieval_strategy: 'semantic' as const,
  k: 5,
  score: 0.5,
}
const retrievalSettingForm = reactive({ ...defaultRetrievalSetting })
const hideRetrievalSettingModal = () => {
  Object.assign(retrievalSettingForm, { ...hitTestingForm })
  retrievalSettingModalVisible.value = false
}
const saveRetrievalSetting = () => {
  hitTestingSegments.splice(0, hitTestingSegments.length)
  Object.assign(hitTestingForm, { query: hitTestingForm.query, ...retrievalSettingForm })
  retrievalSettingModalVisible.value = false
}

const hitTestingLoading = ref(false)
const hitTestingSegments = reactive<RetrievalSegment[]>([])
const hitTestingForm = reactive({
  query: '',
  ...defaultRetrievalSetting,
})
const hideHitTestingModal = () => emits('update:visible', false)
const handleHitTesting = async () => {
  if (hitTestingForm.query.trim() === '') {
    Message.error('检索源文本不能为空')
    return
  }

  try {
    hitTestingLoading.value = true
    const resp = await retrieval(props.dataset_id, hitTestingForm)
    hitTestingSegments.splice(0, hitTestingSegments.length, ...resp.data)
    await loadQueries()
  } finally {
    hitTestingLoading.value = false
  }
}

watch(
  () => props.visible,
  async (newValue) => {
    if (newValue) {
      await loadQueries()
    } else {
      queries.splice(0, queries.length)
      hitTestingSegments.splice(0, hitTestingSegments.length)
      Object.assign(hitTestingForm, { query: '', ...defaultRetrievalSetting })
      Object.assign(retrievalSettingForm, { ...defaultRetrievalSetting })
    }
  },
)
</script>

<template>
  <div>
    <base-modal
      :visible="props.visible"
      title="召回测试"
      :width="1000"
      @update:visible="hideHitTestingModal"
    >
      <div class="text-gray-500 -mt-4 mb-4">基于给定的查询文本测试知识库的召回效果</div>
      <div class="overflow-auto" style="max-height: calc(80vh - 120px)">
        <div class="w-full flex justify-between gap-2">
          <div class="flex flex-col w-1/2 max-w-[450px]">
            <div class="border border-blue-700 bg-blue-100 rounded-lg flex flex-col mb-6">
              <div class="flex items-center justify-between px-4 py-1.5">
                <div class="font-bold text-gray-900">源文本</div>
                <a-button
                  size="small"
                  class="rounded-lg px-2"
                  @click="retrievalSettingModalVisible = true"
                >
                  <template #icon>
                    <icon-language />
                  </template>
                  <div v-if="hitTestingForm.retrieval_strategy === 'semantic'">相似性检索</div>
                  <div v-else-if="hitTestingForm.retrieval_strategy === 'full_text'">全文检索</div>
                  <div v-else>混合检索</div>
                </a-button>
              </div>
              <div class="bg-white rounded-lg p-2">
                <a-textarea
                  v-model:model-value="hitTestingForm.query"
                  placeholder="请输入文本，建议使用简短的陈述句"
                  :max-length="200"
                  :auto-size="{ minRows: 6, maxRows: 6 }"
                  class="!bg-white !border-0 mb-1"
                  @keydown.ctrl.enter="handleHitTesting"
                  @keydown.meta.enter="handleHitTesting"
                />
                <div class="flex items-center justify-between">
                  <a-tag size="small" class="rounded text-gray-700">
                    {{ hitTestingForm.query.length }}/200
                  </a-tag>
                  <a-button
                    :loading="hitTestingLoading"
                    type="primary"
                    size="small"
                    @click="handleHitTesting"
                  >
                    召回测试
                  </a-button>
                </div>
              </div>
            </div>
            <div class="overflow-hidden flex-1 min-h-0 flex flex-col">
              <div class="text-gray-700 font-bold mb-4 flex-shrink-0">最近查询</div>
              <div class="overflow-auto custom-scrollbar" style="max-height: 200px">
                <a-table
                  :loading="queriesLoading"
                  :pagination="false"
                  size="small"
                  :bordered="{ wrapper: false }"
                  :data="queries"
                  @row-click="(record) => (hitTestingForm.query = record.query)"
                >
                  <template #columns>
                    <a-table-column title="文本" data-index="query">
                      <template #cell="{ record }">
                        <div class="line-clamp-1">{{ record.query }}</div>
                      </template>
                    </a-table-column>
                    <a-table-column title="时间" data-index="created_at" :width="160">
                      <template #cell="{ record }">
                        {{ dayjs(record.created_at).format('YYYY-MM-DD HH:mm') }}
                      </template>
                    </a-table-column>
                  </template>
                </a-table>
              </div>
            </div>
          </div>
          <a-divider direction="vertical" />
          <div class="w-1/2 overflow-auto" style="max-height: calc(80vh - 200px)">
            <a-spin :loading="hitTestingLoading" class="w-full">
              <a-row v-if="hitTestingSegments.length > 0" :gutter="[16, 16]">
                <a-col v-for="segment in hitTestingSegments" :key="segment.id" :span="12">
                  <div class="p-4 bg-gray-50 rounded-lg cursor-pointer">
                    <div
                      v-if="hitTestingForm.retrieval_strategy === 'semantic'"
                      class="flex items-center gap-2 mb-1.5"
                    >
                      <icon-pushpin />
                      <a-progress :stroke-width="6" :show-text="false" :percent="segment.score" />
                      <div class="text-gray-700 text-xs">{{ segment.score.toFixed(2) }}</div>
                    </div>
                    <div class="text-gray-500 line-clamp-4 h-[88px] break-all">
                      {{ segment.content }}
                    </div>
                    <a-divider class="my-2" />
                    <div class="flex items-center gap-2 text-gray-500 text-xs">
                      <icon-file class="flex-shrink-0" />
                      <div class="line-clamp-1">
                        {{ segment.document?.name || segment.document_id }}
                      </div>
                    </div>
                  </div>
                </a-col>
              </a-row>
              <a-empty v-else />
            </a-spin>
          </div>
        </div>
      </div>
    </base-modal>
    <base-modal
      :visible="retrievalSettingModalVisible"
      title="检索设置"
      @update:visible="retrievalSettingModalVisible = false"
    >
      <a-form :model="retrievalSettingForm" class="pt-6" @submit="saveRetrievalSetting">
        <a-form-item field="retrieval_strategy" label="检索策略" label-align="left">
          <a-radio-group
            v-model:model-value="retrievalSettingForm.retrieval_strategy"
            default-value="semantic"
            :options="[
              { label: '混合策略', value: 'hybrid' },
              { label: '全文检索', value: 'full_text' },
              { label: '相似性检索', value: 'semantic' },
            ]"
          />
        </a-form-item>
        <a-form-item field="k" label="最大召回数量">
          <div class="flex items-center gap-4 w-full pl-3">
            <a-slider v-model:model-value="retrievalSettingForm.k" :step="1" :min="1" :max="10" />
            <a-input-number
              v-model:model-value="retrievalSettingForm.k"
              class="w-[80px]"
              :default-value="4"
            />
          </div>
        </a-form-item>
        <a-form-item field="score" label="最小匹配度">
          <div class="flex items-center gap-4 w-full pl-3">
            <a-slider
              v-model:model-value="retrievalSettingForm.score"
              :step="0.01"
              :min="0"
              :max="0.99"
            />
            <a-input-number
              v-model:model-value="retrievalSettingForm.score"
              class="w-[80px]"
              :min="0"
              :max="0.99"
              :step="0.01"
              :precision="2"
              :default-value="0.5"
            />
          </div>
        </a-form-item>
        <div class="flex items-center justify-between">
          <div></div>
          <a-space :size="16">
            <a-button @click="hideRetrievalSettingModal">取消</a-button>
            <a-button type="primary" html-type="submit">保存</a-button>
          </a-space>
        </div>
      </a-form>
    </base-modal>
  </div>
</template>
