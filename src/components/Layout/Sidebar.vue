<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter, type RouteRecordRaw } from 'vue-router'

const route = useRoute()
const router = useRouter()

const navItems = computed(() => {
  const defaultLayout = router.options.routes.find((r: RouteRecordRaw) => r.path === '/')
  if (!defaultLayout?.children) return []
  return defaultLayout.children
    .filter((r: RouteRecordRaw) => r.meta?.sidebar)
    .map((r: RouteRecordRaw) => ({
      path: `/${r.path}`,
      label: r.meta?.label as string,
      icon: r.meta?.icon as string,
      color: r.meta?.color as string,
    }))
})

const isActive = (path: string) => route.path === path || route.path.startsWith(path + '/')
</script>

<template>
  <div class="flex flex-col gap-1 px-3">
    <router-link
      v-for="item in navItems"
      :key="item.path"
      :to="item.path"
      class="group flex items-center gap-3 h-10 px-3 rounded-xl transition-all text-sm text-gray-600 hover:text-gray-900 hover:bg-white/70 hover:shadow-sm"
      :class="{ '!text-blue-600 !bg-blue-50 !font-semibold !shadow-sm': isActive(item.path) }"
    >
      <component :is="item.icon" :size="16" :class="item.color" />
      <span>{{ item.label }}</span>
    </router-link>
  </div>
</template>

<style scoped></style>
