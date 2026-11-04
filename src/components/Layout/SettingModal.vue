<script setup lang="ts">
import { reactive, ref, watch } from 'vue'
import { useAccountStore } from '@/stores/account'
import { getCurrentUser, updateAccount } from '@/services/account'
import { uploadImage } from '@/services/upload-file'
import { Message, type FileItem } from '@arco-design/web-vue'
import BaseModal from '@/components/BaseModal/BaseModal.vue'

const props = defineProps({
  visible: { type: Boolean, required: true },
})
const emits = defineEmits(['update:visible'])
const updateName = ref(false)
const updatePassword = ref(false)
const accountStore = useAccountStore()
const accountForm = reactive({
  fileList: [] as FileItem[],
  name: '',
  avatar: '',
  password: '',
  username: '',
})

const updateAccountData = async () => {
  const resp = await getCurrentUser()
  accountStore.update(resp.data)
}

const handleAvatarUpload = (option: { fileItem: FileItem; onSuccess: (response?: unknown) => void }) => {
  const { fileItem, onSuccess } = option
  const uploadTask = async () => {
    const upload_resp = await uploadImage(fileItem.file as File)
    accountForm.avatar = upload_resp.data.image_url
    onSuccess(upload_resp)

    const update_resp = await updateAccount({ avatar: accountForm.avatar })
    Message.success(update_resp.message)
    await updateAccountData()
  }
  uploadTask()
  return { abort: () => {} }
}

const handleSaveName = async () => {
  const resp = await updateAccount({ name: accountForm.name })
  Message.success(resp.message)
  await updateAccountData()
  updateName.value = false
}

const handleSavePassword = async () => {
  const resp = await updateAccount({ password: accountForm.password })
  Message.success(resp.message)
  accountForm.password = ''
  updatePassword.value = false
}

watch(
  () => props.visible,
  (newValue) => {
    if (!newValue) {
      updatePassword.value = false
      updateName.value = false
    }
    Object.assign(accountForm, {
      fileList: accountStore.account.avatar
        ? [{ uid: 1, name: '账号头像', url: accountStore.account.avatar }]
        : [],
      name: accountStore.account.name,
      avatar: accountStore.account.avatar,
      password: '',
      username: accountStore.account.username,
    })
  },
)
</script>

<template>
  <base-modal
    :visible="props.visible"
    title="账号设置"
    @update:visible="(v: boolean) => emits('update:visible', v)"
  >
    <a-form :model="{}" layout="vertical">
      <a-form-item field="avatar" hide-label>
        <a-upload
          v-model:file-list="accountForm.fileList"
          list-type="picture-card"
          :limit="1"
          image-preview
          class="!w-auto mx-auto"
          :custom-request="handleAvatarUpload"
        />
      </a-form-item>
      <a-form-item field="name" label="账号昵称" asterisk-position="end">
        <div v-if="updateName" class="flex items-center gap-2 w-full">
          <a-input
            v-model="accountForm.name"
            placeholder="请输入账号名称"
            :default-value="accountStore.account.name"
          />
          <div class="flex items-center gap-1">
            <a-button
              class="rounded-lg"
              @click="
                () => {
                  updateName = false
                  accountForm.name = accountStore.account.name
                }
              "
              >取消</a-button
            >
            <a-button type="primary" class="rounded-lg" @click="handleSaveName">保存</a-button>
          </div>
        </div>
        <div v-else class="flex items-center gap-1">
          <div>{{ accountStore.account.name }}</div>
          <a-button size="mini" type="text" class="!text-gray-700" @click="updateName = true">
            <template #icon><icon-edit /></template>
          </a-button>
        </div>
      </a-form-item>
      <a-form-item field="password" label="账号密码" asterisk-position="end">
        <div v-if="updatePassword" class="flex items-center gap-2 w-full">
          <a-input-password v-model="accountForm.password" placeholder="请输入新密码" />
          <div class="flex items-center gap-1">
            <a-button
              class="rounded-lg"
              @click="
                () => {
                  updatePassword = false
                  accountForm.password = ''
                }
              "
              >取消</a-button
            >
            <a-button type="primary" class="rounded-lg" @click="handleSavePassword">保存</a-button>
          </div>
        </div>
        <div v-else class="flex items-center gap-1">
          <div>******</div>
          <a-button size="mini" type="text" class="!text-gray-700" @click="updatePassword = true">
            <template #icon><icon-edit /></template>
          </a-button>
        </div>
      </a-form-item>
      <a-form-item field="username" label="用户名">
        <a-input v-model="accountForm.username" readonly />
      </a-form-item>
    </a-form>
  </base-modal>
</template>

<style scoped></style>
