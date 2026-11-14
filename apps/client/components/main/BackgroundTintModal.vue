<template>
  <UModal v-model="isOpen">
    <UContainer
      :ui="{
        base: 'w-[85vw] flex flex-col',
        constrained: 'max-w-[520px]',
      }"
    >
      <CommonModalHeader
        title="背景色调"
        @close="isOpen = false"
      />
      <div class="mt-4 px-4 pb-6">
        <p class="mb-4 text-xs text-gray-500">
          选一个看着舒服的底色，设置会记住；深色模式下使用对应的深色版本。
        </p>
        <div class="grid grid-cols-3 gap-3 sm:grid-cols-5">
          <button
            v-for="tint in tints"
            :key="tint.key"
            :class="[
              'flex flex-col items-center gap-2 rounded-xl border p-2 transition-all',
              tint.key === currentTintKey
                ? 'border-purple-500 ring-2 ring-purple-200 dark:ring-purple-800'
                : 'border-gray-200 hover:border-purple-300 dark:border-gray-600',
            ]"
            @click="setTint(tint.key)"
          >
            <span
              class="h-10 w-full rounded-lg border border-gray-200 dark:border-gray-600"
              :style="{ backgroundColor: tint.light }"
            ></span>
            <span class="text-xs text-gray-600 dark:text-gray-300">{{ tint.label }}</span>
          </button>
        </div>
      </div>
    </UContainer>
  </UModal>
</template>

<script setup lang="ts">
import { ref } from "vue";

import { useBackgroundTint } from "~/composables/user/backgroundTint";

const isOpen = ref(false);
const { tints, currentTintKey, setTint } = useBackgroundTint();

function open() {
  isOpen.value = true;
}

defineExpose({ open });
</script>
