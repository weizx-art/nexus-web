<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { type Form, Message, type ValidatedError } from '@arco-design/web-vue'
import { createSegment, getSegment, updateSegment } from '@/services/dataset'
import BaseModal from '@/components/BaseModal/BaseModal.vue'

const props = defineProps({
  dataset_id: { type: String, required: false },
  document_id: { type: String, required: false },
  segment_id: { type: String, required: false },
  visible: { type: Boolean, required: true },
  callback: { type: Function, required: false },
})
const emits = defineEmits(['update:visible'])
const loading = ref(false)
const defaultForm: { content: string; keywords: string[] } = {
  content: '',
  keywords: [],
}
const form = reactive({ ...defaultForm })
const formRef = ref<InstanceType<typeof Form>>()
const isUpdateOperation = computed(() => props.segment_id && props.segment_id !== '')

const hideModal = () => emits('update:visible', false)

const saveSegment = async ({ errors }: { errors: Record<string, ValidatedError> | undefined }) => {
  if (errors) return

  try {
    loading.value = true
    if (isUpdateOperation.value) {
      await updateSegment(
        props.dataset_id as string,
        props.document_id as string,
        props.segment_id as string,
        form,
      )
    } else {
      await createSegment(props.dataset_id as string, props.document_id as string, form)
    }

    emits('update:visible', false)
    props.callback?.()
    Message.success(isUpdateOperation.value ? '更新成功' : '创建成功')
  } catch {
    Message.error('保存失败')
  } finally {
    loading.value = false
  }
}

watch(
  () => props.visible,
  async (newValue) => {
    formRef.value?.resetFields()

    if (newValue) {
      if (isUpdateOperation.value) {
        const resp = await getSegment(
          props.dataset_id as string,
          props.document_id as string,
          props.segment_id as string,
        )
        const data = resp.data
        form.content = data.content
        form.keywords = data.keywords
      }
    } else {
      formRef.value?.resetFields()
      Object.assign(form, { ...defaultForm })
    }
  },
)
</script>

<template>
  <base-modal :visible="props.visible" :title="isUpdateOperation ? '更新片段' : '添加片段'" @update:visible="hideModal">
    <a-form ref="formRef" :model="form" layout="vertical" @submit="saveSegment">
      <a-form-item
        field="content"
        label="片段内容"
        asterisk-position="end"
        :rules="[{ required: true, message: '片段内容不能为空' }]"
      >
        <a-textarea
          v-model:model-value="form.content"
          :auto-size="{ minRows: 8, maxRows: 8 }"
          placeholder="在这里添加文档片段内容"
        />
      </a-form-item>
      <a-form-item field="keywords" label="关键词">
        <a-input-tag
          v-model:model-value="form.keywords"
          :max-tag-count="10"
          placeholder="请输入该文档片段关键词，最多不超过10个，按Enter输入"
        />
      </a-form-item>
      <div class="flex items-center justify-between">
        <div></div>
        <a-space :size="16">
          <a-button @click="hideModal">取消</a-button>
          <a-button :loading="loading" type="primary" html-type="submit"> 保存 </a-button>
        </a-space>
      </div>
    </a-form>
  </base-modal>
</template>

<style scoped></style>
