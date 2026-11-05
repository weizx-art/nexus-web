<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useCredentialStore } from '@/stores/credential'
import { Message, type ValidatedError } from '@arco-design/web-vue'
import { passwordLogin, register } from '@/services/auth'

const errorMessage = ref('')
const loginLoading = ref(false)
const isRegister = ref(false)
const loginForm = reactive({ username: '', password: '', name: '' })
const credentialStore = useCredentialStore()
const router = useRouter()

onMounted(() => {
  if (import.meta.env.DEV) {
    loginForm.username = 'admin'
    loginForm.password = 'admin123'
  }
})

const forgetPassword = () => Message.error('忘记密码请联系管理员')

const handleSubmit = async ({ errors }: { errors: Record<string, ValidatedError> | undefined }) => {
  if (errors) return

  try {
    loginLoading.value = true
    errorMessage.value = ''

    if (isRegister.value) {
      await register(loginForm.username, loginForm.password, loginForm.name)
      Message.success('注册成功，请登录')
      isRegister.value = false
      loginForm.password = ''
    } else {
      const resp = await passwordLogin(loginForm.username, loginForm.password)
      credentialStore.update(resp.data)
      Message.success('登录成功')
      await router.replace({ path: '/chat' })
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : '操作失败'
    errorMessage.value = message
    loginForm.password = ''
  } finally {
    loginLoading.value = false
  }
}
</script>

<template>
  <div
    class="w-[440px] bg-white rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.1)] p-10 border border-gray-200/30"
  >
    <div class="text-center mb-2 animate-slide-in-left">
      <span class="text-3xl font-bold leading-10 tracking-wider">
        <span class="text-blue-600">综合业务智能</span
        ><span class="text-gray-800" style="font-family: 'Orbitron', sans-serif; font-weight: 800"
          >Agent</span
        >
      </span>
    </div>
    <div class="h-8 text-red-700 leading-8 line-clamp-1 text-center">{{ errorMessage }}</div>
    <a-form
      :model="loginForm"
      layout="vertical"
      size="large"
      class="flex flex-col w-full"
      @submit="handleSubmit"
    >
      <a-form-item
        field="username"
        :rules="[
          { required: true, message: '用户名不能为空' },
          { minLength: 3, maxLength: 30, message: '用户名长度为3-30位' },
        ]"
        :validate-trigger="['change', 'blur']"
        hide-label
      >
        <a-input v-model="loginForm.username" size="large" placeholder="用户名">
          <template #prefix>
            <icon-user />
          </template>
        </a-input>
      </a-form-item>
      <a-form-item v-if="isRegister" field="name" hide-label>
        <a-input v-model="loginForm.name" size="large" placeholder="昵称（可选）">
          <template #prefix>
            <icon-idcard />
          </template>
        </a-input>
      </a-form-item>
      <a-form-item
        field="password"
        :rules="[
          { required: true, message: '账号密码不能为空' },
          { minLength: 8, maxLength: 16, message: '密码长度为8-16位' },
        ]"
        :validate-trigger="['change', 'blur']"
        hide-label
      >
        <a-input-password v-model="loginForm.password" size="large" placeholder="账号密码">
          <template #prefix>
            <icon-lock />
          </template>
        </a-input-password>
      </a-form-item>
      <a-space :size="16" direction="vertical">
        <div v-if="!isRegister" class="flex justify-between">
          <a-checkbox>记住密码</a-checkbox>
          <a-link @click="forgetPassword">忘记密码?</a-link>
        </div>
        <a-button :loading="loginLoading" size="large" type="primary" html-type="submit" long>
          {{ isRegister ? '注册' : '登录' }}
        </a-button>
        <div class="flex justify-center">
          <a-link
            @click="
              () => {
                isRegister = !isRegister
                errorMessage = ''
              }
            "
          >
            {{ isRegister ? '已有账号？去登录' : '没有账号？去注册' }}
          </a-link>
        </div>
      </a-space>
    </a-form>
  </div>
</template>
