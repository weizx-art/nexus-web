<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import Sidebar from './Sidebar.vue'
import { logout } from '@/services/auth'
import { getCurrentUser } from '@/services/account'
import { useCredentialStore } from '@/stores/credential'
import { useAccountStore } from '@/stores/account'
import SettingModal from './SettingModal.vue'
import sidebarTitleBg from '@/assets/images/sidebar-title-bg.png'

const settingModalVisible = ref(false)
const router = useRouter()
const credentialStore = useCredentialStore()
const accountStore = useAccountStore()

const handleLogout = async () => {
  await logout()
  credentialStore.clear()
  accountStore.clear()
  await router.replace({ name: 'login' })
}

onMounted(async () => {
  try {
    const resp = await getCurrentUser()
    accountStore.update(resp.data)
  } catch {
    // token 过期时 request.ts 已自动跳转登录页
  }
})
</script>

<template>
  <a-layout has-sider class="h-full">
    <a-layout-sider
      :width="260"
      class="min-h-screen bg-[#f2f4f7] p-3 shadow-[4px_0_24px_rgba(0,0,0,0.12)] relative z-10"
    >
      <div
        class="h-full flex flex-col justify-between"
        style="
          background-image: radial-gradient(circle, #c5cdd8 0.8px, transparent 0.8px);
          background-size: 16px 16px;
        "
      >
        <div>
          <!-- Logo -->
          <router-link
            to="/chat"
            class="relative flex items-center h-14 px-4 w-full overflow-hidden group"
            :style="{
              backgroundImage: `url(${sidebarTitleBg})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }"
          >
            <div class="absolute inset-0 bg-white/50 group-hover:bg-white/40 transition-colors" />
            <span
              class="relative z-10 text-[20px] font-bold leading-tight w-full text-center tracking-wider animate-slide-in-left drop-shadow-sm whitespace-nowrap"
            >
              <span class="text-blue-700">综合业务智能</span
              ><span
                class="text-gray-900"
                style="font-family: 'Orbitron', sans-serif; font-weight: 800"
                >Agent</span
              >
            </span>
          </router-link>
          <div class="border-b border-gray-300/60 mb-4"></div>

          <!-- 导航分组标题 -->
          <div class="text-[11px] font-semibold text-gray-400 uppercase tracking-wider px-3 mb-2">
            导航菜单
          </div>
          <sidebar />
        </div>

        <!-- 底部用户卡片 -->
        <a-dropdown position="tl">
          <div
            class="relative flex items-center p-2.5 mx-3 my-5 gap-3 transition-all cursor-pointer rounded-xl overflow-hidden group"
            :style="{
              backgroundImage: `url(${sidebarTitleBg})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }"
          >
            <div
              class="absolute inset-0 bg-white/60 group-hover:bg-white/50 transition-colors rounded-xl"
            />
            <a-avatar
              :size="36"
              class="relative z-10 text-sm bg-blue-600 ring-2 ring-blue-100"
              :image-url="accountStore.account.avatar"
            >
              {{ accountStore.account.name?.[0] || '?' }}
            </a-avatar>
            <div class="relative z-10 flex flex-col flex-1 min-w-0">
              <div class="text-sm font-medium text-gray-900 truncate">
                {{ accountStore.account.name }}
              </div>
              <div class="text-xs text-gray-500 truncate">{{ accountStore.account.username }}</div>
            </div>
            <icon-more class="relative z-10 text-gray-500 flex-shrink-0" />
          </div>
          <template #content>
            <a-doption @click="settingModalVisible = true">
              <template #icon>
                <icon-settings />
              </template>
              账号设置
            </a-doption>
            <a-doption @click="handleLogout">
              <template #icon>
                <icon-poweroff />
              </template>
              退出登录
            </a-doption>
          </template>
        </a-dropdown>
      </div>
    </a-layout-sider>
    <a-layout-content class="bg-white flex-1 overflow-hidden">
      <div class="h-full flex flex-col overflow-hidden">
        <router-view />
      </div>
    </a-layout-content>
    <setting-modal v-model:visible="settingModalVisible" />
  </a-layout>
</template>

<style scoped></style>
