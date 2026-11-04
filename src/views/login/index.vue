<script setup lang="ts">
import Banner from './Banner.vue'
import LoginForm from './LoginForm.vue'
import TechBackground from './TechBackground.vue'
</script>

<template>
  <div class="flex h-screen bg-white">
    <Banner />
    <div
      class="relative flex flex-1 items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50/30 to-white"
    >
      <TechBackground />
      <div class="relative z-10">
        <LoginForm />
      </div>
    </div>
  </div>
</template>
