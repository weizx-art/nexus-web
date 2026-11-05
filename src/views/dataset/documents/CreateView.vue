<script setup lang="ts">
import { onUnmounted, reactive, ref } from 'vue'
import { useRoute } from 'vue-router'
import { type Form, Message, type FileItem } from '@arco-design/web-vue'
import { createDocuments, getDocumentsStatus } from '@/services/dataset'
import { uploadFile } from '@/services/upload-file'
import { unescapeString } from '@/utils/helper'
import type { CreateDocumentsRequest } from '@/models/dataset'

let timer: ReturnType<typeof setInterval> | null = null
let batch = ''
let fetchCount = 0
const route = useRoute()
const currentStep = ref(1)
const createDocumentsForm = reactive({
  file_list: [],
  process_type: 'automatic',
  rule: {
    separators: ['\\n'],
    chunk_size: 500,
    chunk_overlap: 50,
    pre_process_rules: [] as string[],
  },
})
const customRuleFormRef = ref<InstanceType<typeof Form>>()
const createDocumentsLoading = ref(false)
const documents = reactive<Array<{ id: string; name: string; status: string }>>([])

const nextStep = async () => {
  if (currentStep.value === 1) {
    if (createDocumentsForm.file_list.length === 0) {
      Message.error('请上传需要添加到知识库的文件')
      return
    }
    const isUploaded = createDocumentsForm.file_list.every(
      (fileItem: FileItem) => fileItem.response?.data?.id,
    )
    if (!isUploaded) {
      Message.warning('文件正在上传中，请稍等')
      return
    }
    currentStep.value++
  } else {
    if (createDocumentsForm.process_type === 'custom') {
      const errors = await customRuleFormRef.value?.validate()
      if (errors) return
    }

    try {
      createDocumentsLoading.value = true
      const req: CreateDocumentsRequest = {
        upload_file_ids: createDocumentsForm.file_list.map(
          (fileItem: FileItem) => fileItem?.response?.data?.id,
        ),
        process_type: createDocumentsForm.process_type as 'automatic' | 'custom',
      }

      if (createDocumentsForm.process_type === 'custom') {
        req.rule = {
          pre_process_rules: [
            {
              id: 'remove_extra_space',
              enabled: createDocumentsForm.rule.pre_process_rules.includes('remove_extra_space'),
            },
            {
              id: 'remove_url_and_email',
              enabled: createDocumentsForm.rule.pre_process_rules.includes('remove_url_and_email'),
            },
          ],
          segment: {
            separators: createDocumentsForm.rule.separators.map((separator: string) =>
              unescapeString(separator),
            ),
            chunk_size: createDocumentsForm.rule.chunk_size,
            chunk_overlap: createDocumentsForm.rule.chunk_overlap,
          },
        }
      }

      const resp = await createDocuments(route.params?.dataset_id as string, req)
      batch = resp.data.batch

      await fetchDocumentsStatus()
      startTimer()
      currentStep.value++
    } finally {
      createDocumentsLoading.value = false
    }
  }
}

const fetchDocumentsStatus = async () => {
  fetchCount++
  const resp = await getDocumentsStatus(route.params?.dataset_id as string, batch)
  const data = resp.data

  documents.splice(0, documents.length, ...data)

  if (fetchCount >= 30) stopTimer()

  const isCompleted = data.every(
    (document: { id: string; name: string; status: string }) =>
      document.status === 'complete' || document.status === 'error',
  )
  if (isCompleted) stopTimer()
}

const startTimer = () => {
  timer = setInterval(fetchDocumentsStatus, 5000)
}

const stopTimer = () => {
  if (timer) {
    clearInterval(timer)
    timer = null
  }
}

const handleFileUpload = (option: {
  fileItem: FileItem
  onSuccess: (response?: unknown) => void
}) => {
  const { fileItem, onSuccess } = option
  const uploadTask = async () => {
    const resp = await uploadFile(fileItem.file as File)
    onSuccess(resp)
  }
  uploadTask()
  return { abort: () => {} }
}

onUnmounted(() => stopTimer())
</script>

<template>
  <div class="p-6">
    <div class="flex items-center mb-6 gap-4">
      <router-link
        :to="{
          name: 'dataset-documents-list',
          params: { dataset_id: route.params?.dataset_id as string },
        }"
      >
        <a-button size="mini" type="text" class="!text-gray-700">
          <template #icon>
            <icon-left />
          </template>
        </a-button>
      </router-link>
      <div class="text-lg font-bold text-gray-700">添加文件</div>
    </div>
    <div class="w-[520px] mx-auto">
      <a-steps :current="currentStep">
        <a-step>上传</a-step>
        <a-step>分段设置</a-step>
        <a-step>数据处理</a-step>
      </a-steps>
    </div>
    <div class="min-h-[calc(100vh-160px)] p-[48px]">
      <div v-if="currentStep === 1">
        <a-upload
          v-model:file-list="createDocumentsForm.file_list"
          draggable
          accept=".doc,.docx,.pdf,.txt,.md,.markdown,.csv,.xls,.xlsx,.html,.htm"
          :limit="10"
          multiple
          tip="支持PDF、TXT、DOC、DOCX、MD、CSV等格式，最多可上传10个文件，每个文件不超过15MB"
          :custom-request="handleFileUpload"
        />
      </div>
      <div v-else-if="currentStep === 2">
        <div
          :class="`px-5 py-4 bg-white rounded-lg border cursor-pointer mb-4 hover:border-blue-700 ${createDocumentsForm.process_type === 'automatic' ? 'border-blue-700' : ''}`"
          @click="createDocumentsForm.process_type = 'automatic'"
        >
          <div class="font-bold text-gray-700 mb-2">自动分段与清洗</div>
          <div class="text-gray-500">自动分段与预处理规则</div>
        </div>
        <div
          :class="`px-5 py-4 bg-white rounded-lg border cursor-pointer hover:border-blue-700 ${createDocumentsForm.process_type === 'custom' ? 'border-blue-700' : ''}`"
          @click="createDocumentsForm.process_type = 'custom'"
        >
          <div class="font-bold text-gray-700 mb-2">自定义</div>
          <div class="text-gray-500">自定义分段规则、分段长度与预处理规则</div>
          <div v-if="createDocumentsForm.process_type === 'custom'">
            <a-divider />
            <a-form ref="customRuleFormRef" :model="createDocumentsForm.rule" layout="vertical">
              <a-form-item
                field="separators"
                label="分段标识符"
                required
                asterisk-position="end"
                :rules="[{ required: true, message: '分段标识符不能为空' }]"
              >
                <a-input-tag
                  v-model:model-value="createDocumentsForm.rule.separators"
                  placeholder="请输入分段标识符，按下Enter结束"
                />
              </a-form-item>
              <a-form-item
                field="chunk_size"
                label="分段最大长度"
                required
                asterisk-position="end"
                :rules="[{ required: true, message: '分段最大长度不能为空' }]"
              >
                <a-input-number
                  v-model:model-value="createDocumentsForm.rule.chunk_size"
                  :min="100"
                  :max="1000"
                  :step="1"
                  :default-value="500"
                  placeholder="请输入100-1000的数字"
                />
              </a-form-item>
              <a-form-item
                field="chunk_overlap"
                label="块重叠数"
                required
                asterisk-position="end"
                :rules="[{ required: true, message: '块重叠大小不能为空' }]"
              >
                <a-input-number
                  v-model:model-value="createDocumentsForm.rule.chunk_overlap"
                  :min="0"
                  :max="500"
                  :step="1"
                  :default-value="50"
                  placeholder="请输入0-500的数字"
                />
              </a-form-item>
              <a-form-item field="pre_process_rules" label="文本预处理规则">
                <a-checkbox-group
                  v-model:model-value="createDocumentsForm.rule.pre_process_rules"
                  direction="vertical"
                >
                  <a-checkbox value="remove_extra_space">
                    替换掉连续的空格、换行符和制表符
                  </a-checkbox>
                  <a-checkbox value="remove_url_and_email">删除所有 URL 和电子邮件</a-checkbox>
                </a-checkbox-group>
              </a-form-item>
            </a-form>
          </div>
        </div>
      </div>
      <div v-else>
        <div class="text-gray-900 mb-4 text-base">服务器正在处理中</div>
        <div class="flex flex-col gap-2">
          <div
            v-for="document in documents"
            :key="document.id"
            class="flex items-center justify-between px-4 py-3 bg-white rounded-lg border"
          >
            <div class="flex items-center gap-2.5">
              <a-avatar shape="square" class="bg-blue-700" :size="32">
                <icon-file />
              </a-avatar>
              <div>
                <div class="text-gray-700">{{ document.name }}</div>
              </div>
            </div>
            <div v-if="document.status === 'error'" class="text-red-500">处理出错</div>
            <div v-else-if="document.status === 'complete'" class="text-green-500">处理完成</div>
            <div v-else class="text-gray-500">处理中...</div>
          </div>
        </div>
      </div>
    </div>
    <div class="flex items-center justify-between px-[48px]">
      <div></div>
      <div class="flex items-center gap-2">
        <a-button
          v-if="currentStep === 2"
          @click="
            () => {
              if (currentStep > 1) currentStep--
            }
          "
        >
          上一步
        </a-button>
        <a-button
          v-if="currentStep <= 2"
          :loading="createDocumentsLoading"
          type="primary"
          @click="nextStep"
        >
          下一步
        </a-button>
        <div v-if="currentStep === 3" class="flex items-center gap-2">
          <div class="text-gray-500">点击确认不影响数据处理，处理完毕后可进行引用</div>
          <router-link
            :to="{
              name: 'dataset-documents-list',
              params: { dataset_id: route.params?.dataset_id as string },
            }"
          >
            <a-button type="primary">确定</a-button>
          </router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped></style>
