<script setup lang="ts">
import { reactive, ref, watch } from 'vue'
import { type Form, Message, type ValidatedError } from '@arco-design/web-vue'
import { getDocument, updateDocument } from '@/services/dataset'
import BaseModal from '@/components/BaseModal/BaseModal.vue'

const props = defineProps({
  visible: { type: Boolean, required: true },
  dataset_id: { type: String, required: true },
  document_id: { type: String, required: true },
  onAfterUpdate: {
    type: Function,
    required: false,
    default: () => {},
  },
})
const emits = defineEmits(['update:visible'])
const loading = ref(false)
const form = reactive({ name: '' })
const formRef = ref<InstanceType<typeof Form>>()

const hideModal = () => {
  emits('update:visible', false)
  formRef.value?.resetFields()
}

const handleSubmit = async ({ errors }: { errors: Record<string, ValidatedError> | undefined }) => {
  if (errors) return

  try {
    loading.value = true
    const resp = await updateDocument(props.dataset_id, props.document_id, { name: form.name })
    Message.success(resp.message)

    hideModal()
    props.onAfterUpdate()
  } catch {
    Message.error('保存失败')
  } finally {
    loading.value = false
  }
}

watch(
  () => props.visible,
  async (newValue: boolean) => {
    if (newValue) {
      const resp = await getDocument(props.dataset_id, props.document_id)
      formRef.value?.resetFields()
      form.name = resp.data.name
    }
  },
)
</script>

<template>
  <base-modal :visible="visible" title="重命名" @update:visible="hideModal">
    <a-form ref="formRef" :model="form" layout="vertical" @submit="handleSubmit">
      <a-form-item
        field="name"
        label="名称"
        asterisk-position="end"
        :rules="[{ required: true, message: '文档名称不能为空' }]"
      >
        <a-input
          v-model="form.name"
          placeholder="请输入文档名称"
          show-word-limit
          :max-length="100"
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
