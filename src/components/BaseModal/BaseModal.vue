<script setup lang="ts">
const props = defineProps({
  visible: { type: Boolean, required: true },
  title: { type: String, default: '' },
  width: { type: Number, default: 520 },
})
const emits = defineEmits(['update:visible', 'cancel'])

const handleCancel = () => {
  emits('update:visible', false)
  emits('cancel')
}
</script>

<template>
  <a-modal
    :visible="props.visible"
    hide-title
    :footer="false"
    :width="props.width"
    @cancel="handleCancel"
  >
    <div class="flex items-center justify-between">
      <div class="text-lg font-bold text-gray-700">{{ props.title }}</div>
      <a-button type="text" class="!text-gray-700" size="small" @click="handleCancel">
        <template #icon>
          <icon-close />
        </template>
      </a-button>
    </div>
    <div class="pt-6">
      <slot />
    </div>
  </a-modal>
</template>

<style scoped></style>
