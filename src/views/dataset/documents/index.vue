<script setup lang="ts">
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import dayjs from 'dayjs'
import {
  useDeleteDocument,
  useGetDataset,
  useGetDocumentsWithPage,
  useUpdateDocumentEnabled,
} from '@/hooks/use-dataset'
import UpdateDocumentNameModal from './UpdateDocumentNameModal.vue'
import HitTestingModal from './HitTestingModal.vue'

const route = useRoute()
const router = useRouter()
const hitModalVisible = ref(false)
const updateDocumentNameModalVisible = ref(false)
const updateDocumentID = ref('')
const { dataset, loadDataset } = useGetDataset(route.params?.dataset_id as string)
const { loading, documents, paginator, loadDocuments } = useGetDocumentsWithPage(
  route.params?.dataset_id as string,
)
const { handleDelete } = useDeleteDocument()
const { handleUpdate: handleUpdateEnabled } = useUpdateDocumentEnabled()
</script>

<template>
  <div class="p-6 h-full overflow-hidden flex flex-col">
    <div class="flex items-center w-full gap-2 mb-6 flex-shrink-0">
      <router-link :to="{ name: 'dataset-list' }">
        <a-button size="mini" type="text" class="!text-gray-700">
          <template #icon>
            <icon-left />
          </template>
        </a-button>
      </router-link>
      <div class="flex items-center gap-3">
        <a-avatar
          :size="40"
          shape="square"
          :image-url="`https://picsum.photos/seed/${dataset?.id}/400/400`"
        />
        <div class="flex flex-col justify-between h-[40px]">
          <a-skeleton-line v-if="!dataset?.name" :widths="[100]" />
          <div v-else class="text-gray-700">知识库 / {{ dataset.name }}</div>
          <div v-if="!dataset?.name" class="flex items-center gap-2">
            <a-skeleton-line :widths="[60]" :line-height="18" />
            <a-skeleton-line :widths="[60]" :line-height="18" />
            <a-skeleton-line :widths="[60]" :line-height="18" />
          </div>
          <div v-else class="flex items-center gap-2">
            <a-tag size="small" class="rounded h-[18px] leading-[18px] bg-gray-200 text-gray-500">
              {{ dataset.document_count }} 文档
            </a-tag>
            <a-tag size="small" class="rounded h-[18px] leading-[18px] bg-gray-200 text-gray-500">
              {{ dataset.hit_count }} 命中
            </a-tag>
          </div>
        </div>
      </div>
    </div>
    <div class="flex items-center justify-between mb-6 flex-shrink-0">
      <a-input-search
        :default-value="route.query?.search || ''"
        placeholder="请输入关键词搜索文档"
        style="width: 240px"
        @search="
          (value: string) => {
            router.push({
              path: route.path,
              query: { search: value, current_page: 1 },
            })
          }
        "
        @keyup.enter="
          (e: Event) => {
            const value = (e.target as HTMLInputElement).value
            router.push({
              path: route.path,
              query: { search: value, current_page: 1 },
            })
          }
        "
      />
      <a-space :size="12">
        <a-button @click="hitModalVisible = true">召回测试</a-button>
        <router-link
          :to="{
            name: 'dataset-documents-create',
            params: { dataset_id: route.params?.dataset_id as string },
          }"
        >
          <a-button type="primary">添加文件</a-button>
        </router-link>
      </a-space>
    </div>
    <div class="flex-1 overflow-auto scrollbar-w-none">
      <a-table
        hoverable
        :pagination="{
          total: paginator.total_record,
          current: paginator.current_page,
          defaultCurrent: 1,
          pageSize: paginator.page_size,
          defaultPageSize: 20,
          showTotal: true,
        }"
        :loading="loading"
        :data="documents"
        :bordered="{ wrapper: false }"
        @page-change="
          (page: number) => {
            router.push({
              path: route.path,
              query: {
                current_page: page,
                search: route.query?.search || '',
              },
            })
          }
        "
      >
        <template #columns>
          <a-table-column title="#" data-index="position" align="center" :width="80" />
          <a-table-column title="文档名" data-index="name" :width="400">
            <template #cell="{ record }">
              <router-link
                :to="{
                  name: 'dataset-segments-list',
                  params: {
                    dataset_id: route.params?.dataset_id as string,
                    document_id: record.id as string,
                  },
                }"
                class="line-clamp-1 hover:text-gray-900"
              >
                {{ record.name }}
              </router-link>
            </template>
          </a-table-column>
          <a-table-column title="字符数" data-index="character_count">
            <template #cell="{ record }">
              {{ ((record.character_count || 0) / 1000).toFixed(1) }}k
            </template>
          </a-table-column>
          <a-table-column title="召回次数" data-index="hit_count" />
          <a-table-column title="上传时间" data-index="created_at">
            <template #cell="{ record }">
              {{ dayjs(record.created_at).format('YYYY-MM-DD HH:mm:ss') }}
            </template>
          </a-table-column>
          <a-table-column title="状态" data-index="enabled">
            <template #cell="{ record }">
              <a-space>
                <div
                  v-if="record.enabled"
                  class="w-2 h-2 bg-green-500 rounded-sm border border-green-700"
                ></div>
                <div v-else class="w-2 h-2 bg-gray-500 rounded-sm border border-gray-700"></div>
                <div v-if="record.enabled" class="text-gray-700">可用</div>
                <div v-else class="text-gray-700">已禁用</div>
              </a-space>
            </template>
          </a-table-column>
          <a-table-column title="操作" data-index="operator" cell-class="!h-[40px]" :width="100">
            <template #cell="{ record, rowIndex }">
              <a-space :size="0">
                <template #split>
                  <a-divider direction="vertical" />
                </template>
                <a-tooltip
                  v-if="record.status === 'error'"
                  position="left"
                  :content="`错误信息: ${record.error}`"
                >
                  <a-switch size="small" type="round" :default-checked="false" disabled />
                </a-tooltip>
                <a-switch
                  v-else
                  size="small"
                  type="round"
                  :model-value="record.enabled"
                  @change="
                    (value) => {
                      handleUpdateEnabled(
                        route.params?.dataset_id as string,
                        record.id,
                        value as boolean,
                        () => {
                          documents[rowIndex].enabled = value
                        },
                      )
                    }
                  "
                />
                <a-dropdown position="br">
                  <a-button type="text" size="mini" class="!text-gray-700">
                    <template #icon>
                      <icon-more />
                    </template>
                  </a-button>
                  <template #content>
                    <a-doption
                      @click="
                        () => {
                          updateDocumentNameModalVisible = true
                          updateDocumentID = record.id
                        }
                      "
                      >重命名
                    </a-doption>
                    <a-doption
                      class="!text-red-700"
                      @click="
                        () =>
                          handleDelete(route.params?.dataset_id as string, record.id, async () => {
                            await loadDocuments()
                            await loadDataset(route.params?.dataset_id as string)
                          })
                      "
                    >
                      删除
                    </a-doption>
                  </template>
                </a-dropdown>
              </a-space>
            </template>
          </a-table-column>
        </template>
      </a-table>
    </div>
    <update-document-name-modal
      v-model:visible="updateDocumentNameModalVisible"
      :document_id="updateDocumentID"
      :dataset_id="route.params?.dataset_id as string"
      :on-after-update="() => loadDocuments()"
    />
    <hit-testing-modal
      v-model:visible="hitModalVisible"
      :dataset_id="route.params?.dataset_id as string"
    />
  </div>
</template>

<style scoped></style>
