<template>
  <UModal v-model="isOpen">
    <UContainer
      :ui="{
        base: 'w-[85vw] flex flex-col',
        constrained: 'max-w-[440px]',
      }"
    >
      <CommonModalHeader
        title="音量"
        @close="isOpen = false"
      />
      <div class="mt-4 px-4 pb-6">
        <div class="flex items-center gap-3">
          <UIcon
            :name="icon"
            class="h-6 w-6 text-gray-500 dark:text-gray-300"
          />
          <input
            :value="volume"
            type="range"
            min="0"
            max="100"
            step="5"
            class="h-2 w-full cursor-pointer accent-purple-500"
            @input="handleInput"
          />
          <span
            class="w-12 shrink-0 text-right text-sm tabular-nums text-gray-600 dark:text-gray-300"
          >
            {{ volume }}%
          </span>
        </div>

        <p class="mt-4 text-xs leading-relaxed text-gray-500 dark:text-gray-400">
          影响句子发音、单词发音、对错提示音和打字音效；设置会记住。
        </p>

        <div class="mt-5 flex justify-end gap-2">
          <button
            class="btn btn-sm"
            @click="toggleMute"
          >
            {{ muted ? "取消静音" : "静音" }}
          </button>
          <button
            class="btn btn-primary btn-sm"
            @click="isOpen = false"
          >
            完成
          </button>
        </div>
      </div>
    </UContainer>
  </UModal>
</template>

<script setup lang="ts">
import { ref } from "vue";

import { useVolume } from "~/composables/user/volume";

const isOpen = ref(false);
const { volume, muted, icon, setVolume, toggleMute } = useVolume();

function handleInput(event: Event) {
  const target = event.target as HTMLInputElement;
  setVolume(Number(target.value));
}

function open() {
  isOpen.value = true;
}

defineExpose({ open });
</script>
