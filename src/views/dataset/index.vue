<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import {
  useCreateOrUpdateDataset,
  useDeleteDataset,
  useGetDatasetsWithPage,
} from '@/hooks/use-dataset'
import { getDataset } from '@/services/dataset'
import { uploadImage } from '@/services/upload-file'
import dayjs from 'dayjs'
import type { ValidatedError, FileItem } from '@arco-design/web-vue'
import BaseModal from '@/components/BaseModal/BaseModal.vue'

const router = useRouter()
let updateDatasetID = ''
const createType = ref('')
const { loading, datasets, paginator, loadDatasets } = useGetDatasetsWithPage()
const {
  loading: submitLoading,
  form,
  formRef,
  saveDataset,
  showUpdateModal,
  updateShowUpdateModal,
} = useCreateOrUpdateDataset()
const { handleDelete } = useDeleteDataset()

const handleScroll = async (event: UIEvent) => {
  const { scrollTop, scrollHeight, clientHeight } = event.target as HTMLElement
  if (scrollTop + clientHeight >= scrollHeight - 10) {
    if (loading.value) return
    await loadDatasets()
  }
}

const handleUpdate = (dataset_id: string) => {
  updateShowUpdateModal(true, async () => {
    const resp = await getDataset(dataset_id)
    const data = resp.data
    updateDatasetID = dataset_id

    formRef.value?.resetFields()
    const iconUrl = data.icon || `https://picsum.photos/seed/${dataset_id}/400/400`
    form.fileList = [{ uid: '1', name: '知识库图标', url: iconUrl }]
    form.icon = data.icon || ''
    form.name = data.name
    form.description = data.description
  })
}

const handleCancel = () => {
  updateShowUpdateModal(false, async () => {
    updateDatasetID = ''
    formRef.value?.resetFields()
    createType.value = ''
  })
}

const handleSubmit = async ({ errors }: { errors: Record<string, ValidatedError> | undefined }) => {
  if (errors) return
  await saveDataset(updateDatasetID)
  handleCancel()
  await loadDatasets(true)
}

const handleIconUpload = (option: {
  fileItem: FileItem
  onSuccess: (response?: unknown) => void
  onError: (error: unknown) => void
}) => {
  const { fileItem, onSuccess, onError } = option
  const uploadTask = async () => {
    try {
      const resp = await uploadImage(fileItem.file as File)
      form.icon = resp.data.image_url
      onSuccess(resp)
    } catch (error) {
      onError(error)
    }
  }
  uploadTask()
  return { abort: () => {} }
}

const handleIconRemove = async () => {
  form.icon = ''
  return true
}
</script>

<template>
  <div class="px-6 pt-6 flex flex-col overflow-hidden h-full">
    <div class="flex items-center justify-between mb-6">
      <div class="flex items-center gap-2">
        <a-avatar :size="32" class="bg-blue-700">
          <icon-storage :size="18" />
        </a-avatar>
        <div class="text-lg font-medium text-gray-900">知识库</div>
      </div>
      <a-button type="primary" @click="createType = 'dataset'"> 创建知识库 </a-button>
    </div>
    <a-spin
      :loading="loading"
      class="block flex-1 w-full scrollbar-w-none overflow-scroll"
      @scroll="handleScroll"
    >
      <a-row :gutter="[20, 20]" class="flex-1">
        <a-col v-for="dataset in datasets" :key="dataset.id" :span="6">
          <a-card
            hoverable
            class="cursor-pointer bg-white"
            @click="
              () =>
                router.push({ name: 'dataset-documents-list', params: { dataset_id: dataset.id } })
            "
          >
            <div class="flex items-center gap-3 mb-3">
              <a-avatar
                :size="40"
                shape="square"
                :image-url="`https://picsum.photos/seed/${dataset.id}/400/400`"
              />
              <div class="flex flex-1 justify-between">
                <div class="flex flex-col">
                  <div class="text-base text-gray-900 font-bold">
                    {{ dataset.name }}
                  </div>
                  <div class="text-xs text-gray-500 line-clamp-1">
                    {{ dataset.document_count }} 文档 ·
                    {{ Math.round((dataset.character_count || 0) / 1000) }} 千字符
                  </div>
                </div>
                <a-dropdown position="br">
                  <a-button type="text" size="small" class="!text-gray-700" @click.stop>
                    <template #icon>
                      <icon-more />
                    </template>
                  </a-button>
                  <template #content>
                    <a-doption @click="() => handleUpdate(dataset.id)">设置</a-doption>
                    <a-doption
                      class="!text-red-500"
                      @click="() => handleDelete(dataset.id, () => loadDatasets(true))"
                    >
                      删除
                    </a-doption>
                  </template>
                </a-dropdown>
              </div>
            </div>
            <div class="leading-[18px] text-gray-500 h-[72px] line-clamp-4 mb-2 break-all">
              {{ dataset.description }}
            </div>
            <div class="flex items-center gap-1.5">
              <a-avatar :size="18" class="bg-blue-700">
                <icon-user />
              </a-avatar>
              <div class="text-xs text-gray-400">
                最近编辑
                {{ dayjs(dataset.created_at).format('MM-DD HH:mm') }}
              </div>
            </div>
          </a-card>
        </a-col>
        <a-col v-if="datasets.length === 0" :span="24">
          <a-empty
            description="没有可用的知识库"
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
      <base-modal
        :visible="createType === 'dataset' || showUpdateModal"
        :title="createType === 'dataset' ? '新建知识库' : '更新知识库'"
        @update:visible="
          (v: boolean) => {
            if (!v) handleCancel()
          }
        "
      >
        <a-form ref="formRef" :model="form" layout="vertical" @submit="handleSubmit">
          <a-form-item field="fileList" hide-label>
            <a-upload
              v-model:file-list="form.fileList"
              :limit="1"
              list-type="picture-card"
              accept="image/png, image/jpeg"
              class="!w-auto mx-auto"
              image-preview
              :custom-request="handleIconUpload"
              :on-before-remove="handleIconRemove"
            />
          </a-form-item>
          <a-form-item
            field="name"
            label="知识库名称"
            asterisk-position="end"
            :rules="[{ required: true, message: '知识库名称不能为空' }]"
          >
            <a-input
              v-model="form.name"
              placeholder="请输入知识库名称"
              show-word-limit
              :max-length="100"
            />
          </a-form-item>
          <a-form-item field="description" label="知识库描述" asterisk-position="end">
            <a-textarea
              v-model="form.description"
              :auto-size="{ minRows: 4, maxRows: 6 }"
              placeholder="请输入知识库内容的描述"
            />
          </a-form-item>
          <div class="flex items-center justify-between">
            <div></div>
            <a-space :size="16">
              <a-button @click="handleCancel">取消</a-button>
              <a-button :loading="submitLoading" type="primary" html-type="submit"> 保存 </a-button>
            </a-space>
          </div>
        </a-form>
      </base-modal>
    </a-spin>
  </div>
</template>

<style scoped></style>
