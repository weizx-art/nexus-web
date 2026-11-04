<script setup lang="ts">
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import dayjs from 'dayjs'
import {
  useDeleteSegment,
  useGetDocument,
  useGetSegmentsWithPage,
  useUpdateSegmentEnabled,
} from '@/hooks/use-dataset'
import CreateOrUpdateSegmentModal from './CreateOrUpdateSegmentModal.vue'

const route = useRoute()
const router = useRouter()
const createOrUpdateModalVisible = ref(false)
const updateSegmentID = ref('')
const { document } = useGetDocument(
  route.params?.dataset_id as string,
  route.params?.document_id as string,
)
const { loading, segments, paginator, loadSegments } = useGetSegmentsWithPage(
  route.params?.dataset_id as string,
  route.params?.document_id as string,
)
const { handleDelete } = useDeleteSegment()
const { handleUpdate: handleUpdateSegmentEnabled } = useUpdateSegmentEnabled()

const handleScroll = async (event: UIEvent) => {
  const { scrollTop, scrollHeight, clientHeight } = event.target as HTMLElement
  if (scrollTop + clientHeight >= scrollHeight - 10) {
    if (loading.value) return
    await loadSegments()
  }
}
</script>

<template>
  <div class="px-6 pt-6 flex flex-col overflow-hidden h-full">
    <div class="sticky top-0 z-20 bg-gray-50">
      <div class="flex items-center w-full gap-2 mb-6">
        <router-link
          :to="{
            name: 'dataset-documents-list',
            params: {
              dataset_id: route.params?.dataset_id as string,
            },
          }"
        >
          <a-button size="mini" type="text" class="!text-gray-700">
            <template #icon>
              <icon-left />
            </template>
          </a-button>
        </router-link>
        <div class="flex items-center gap-3">
          <a-avatar :size="40" shape="square" class="rounded-lg bg-blue-700">
            <icon-file />
          </a-avatar>
          <div class="flex flex-col justify-between h-[40px]">
            <a-skeleton-line v-if="!document?.name" :widths="[100]" />
            <div v-else class="text-gray-700">文档 / {{ document.name }}</div>
            <div v-if="!document?.name" class="flex items-center gap-2">
              <a-skeleton-line :widths="[60]" :line-height="18" />
              <a-skeleton-line :widths="[60]" :line-height="18" />
              <a-skeleton-line :widths="[60]" :line-height="18" />
            </div>
            <div v-else class="flex items-center gap-2">
              <a-tag size="small" class="rounded h-[18px] leading-[18px] bg-gray-200 text-gray-500">
                {{ document.segment_count }} 文档片段
              </a-tag>
              <a-tag size="small" class="rounded h-[18px] leading-[18px] bg-gray-200 text-gray-500">
                {{ document.hit_count }} 命中
              </a-tag>
              <a-tag size="small" class="rounded h-[18px] leading-[18px] bg-gray-200 text-gray-500">
                {{ dayjs(document.updated_at).format('YYYY-MM-DD HH:mm') }} 最后编辑
              </a-tag>
            </div>
          </div>
        </div>
      </div>
      <div class="flex items-center justify-between mb-6">
        <a-input-search
          :default-value="route.query?.search || ''"
          placeholder="请输入关键词搜索片段"
          style="width: 240px"
          @search="
            (value: string) => {
              router.push({
                path: route.path,
                query: { search: value },
              })
            }
          "
          @keyup.enter="
            (e: Event) => {
              const value = (e.target as HTMLInputElement).value
              router.push({
                path: route.path,
                query: { search: value },
              })
            }
          "
        />
        <a-space :size="12">
          <div
            class="flex items-center gap-2 h-8 leading-8 bg-white rounded-lg px-3 text-gray-700 border"
          >
            <div
              v-if="document.enabled"
              class="w-2 h-2 bg-green-500 border border-green-700 rounded-sm"
            ></div>
            <div v-else class="w-2 h-2 bg-gray-500 border border-gray-200 rounded-sm"></div>
            {{ document.enabled ? '可用' : '已禁用' }}
          </div>
          <a-button
            type="primary"
            @click="
              () => {
                createOrUpdateModalVisible = true
                updateSegmentID = ''
              }
            "
          >
            <template #icon>
              <icon-file />
            </template>
            添加片段
          </a-button>
        </a-space>
      </div>
    </div>
    <a-spin
      :loading="loading"
      class="block h-full w-full scrollbar-w-none overflow-scroll"
      @scroll="handleScroll"
    >
      <a-row :gutter="[20, 20]">
        <a-col v-for="segment in segments" :key="segment.id" :span="6">
          <a-card hoverable class="cursor-pointer bg-white">
            <div class="flex items-center justify-between mb-2">
              <a-tag size="small" class="rounded-md text-gray-500">
                #{{ String(segment.position).padStart(3, '0') }}
              </a-tag>
              <div class="flex items-center">
                <div class="flex items-center gap-1 text-xs text-gray-700">
                  {{ segment.enabled ? '已启用' : '已禁用' }}
                  <div
                    v-if="segment.enabled"
                    class="w-2 h-2 more-500 border border-green-700 rounded-sm"
                  ></div>
                  <div v-else class="w-2 h-2 bg-gray-500 border border-gray-700 rounded-sm"></div>
                </div>
                <a-divider direction="vertical" />
                <a-switch
                  v-model:model-value="segment.enabled"
                  :disabled="segment.status !== 'complete'"
                  type="round"
                  size="small"
                  @change="
                    async (value) =>
                      await handleUpdateSegmentEnabled(
                        route.params?.dataset_id as string,
                        route.params?.document_id as string,
                        segment.id,
                        value as boolean,
                      )
                  "
                />
              </div>
            </div>
            <div
              class="leading-[18px] text-gray-700 h-[72px] line-clamp-4 mb-2 break-all cursor-pointer"
              @click="
                () => {
                  updateSegmentID = segment.id
                  createOrUpdateModalVisible = true
                }
              "
            >
              {{ segment.content }}
            </div>
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-3">
                <div class="flex items-center gap-1 text-xs text-gray-500">
                  <icon-bookmark />
                  {{ segment.character_count }} 字符
                </div>
                <div class="flex items-center gap-1 text-xs text-gray-500">
                  <icon-pushpin />
                  {{ segment.hit_count }} 命中
                </div>
              </div>
              <a-button
                type="text"
                size="mini"
                class="!text-gray-500"
                @click="
                  async () =>
                    await handleDelete(
                      route.params?.dataset_id as string,
                      route.params?.document_id as string,
                      segment.id,
                      () => loadSegments(true),
                    )
                "
              >
                <template #icon>
                  <icon-delete />
                </template>
              </a-button>
            </div>
          </a-card>
        </a-col>
        <a-col v-if="segments.length === 0" :span="24">
          <a-empty
            description="没有可用的文档片段"
            class="h-[400px] flex flex-col items-center justify-center"
          />
        </a-col>
      </a-row>
      <a-row v-if="paginator.total_page >= 2">
        <a-col v-if="paginator.current_page <= paginator.total_page" :span="24" align="center">
          <a-space class="my-4">
            <a-spin />
            <div class="text-gray-400">加载中</div>
          </a-space>
        </a-col>
        <a-col v-else :span="24" align="center">
          <div class="text-gray-400 my-4">数据已加载完成</div>
        </a-col>
      </a-row>
    </a-spin>
    <create-or-update-segment-modal
      v-model:visible="createOrUpdateModalVisible"
      :dataset_id="route.params?.dataset_id as string"
      :document_id="route.params?.document_id as string"
      :segment_id="updateSegmentID"
      :callback="() => loadSegments(true)"
    />
  </div>
</template>

<style scoped></style>
