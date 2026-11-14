<template>
  <div
    v-if="analysis && analysis.segments.length"
    class="flex flex-col gap-3"
  >
    <div
      v-for="segment in analysis.segments"
      :key="segment.text"
      class="rounded-2xl bg-[#eef5ea] p-4 text-gray-800 shadow-sm dark:bg-gray-800 dark:text-gray-100"
    >
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          <span
            class="h-3.5 w-3.5 rounded-full"
            :style="{ backgroundColor: roleColor(segment.role) }"
          ></span>
          <span class="text-base font-bold">{{ segment.role }}</span>
        </div>
        <span class="text-sm italic text-gray-500 dark:text-gray-400">{{ segment.roleEn }}</span>
      </div>

      <p class="mt-2 text-sm leading-relaxed text-gray-600 dark:text-gray-300">
        {{ segment.explanation }}
      </p>

      <div class="mt-4 flex flex-wrap items-end justify-center gap-x-6 gap-y-3">
        <div
          v-for="word in segment.words"
          :key="word.text"
          class="flex min-w-[88px] flex-col items-center"
        >
          <span class="text-xs text-gray-500 dark:text-gray-400">{{ word.phonetic }}</span>
          <span class="mt-1 text-2xl font-semibold leading-tight sm:text-3xl">{{ word.text }}</span>
          <span
            class="mt-1 h-[3px] w-full rounded-full"
            :style="{ backgroundColor: roleColor(segment.role) }"
          ></span>
          <span class="mt-2 text-sm">{{ word.meaning }}</span>
          <span class="text-xs text-gray-400">{{ word.pos }}</span>
        </div>
      </div>
    </div>
  </div>
  <div
    v-else
    class="rounded-2xl bg-gray-50 p-4 text-center text-sm text-gray-500 dark:bg-gray-800 dark:text-gray-400"
  >
    该句还没有语法成分标注
  </div>
</template>

<script setup lang="ts">
import type { StatementAnalysis } from "~/types/models/statement-analysis";

defineProps<{
  analysis: StatementAnalysis | null | undefined;
}>();

const ROLE_COLORS: Record<string, string> = {
  主语: "#f0a020",
  谓语: "#22a06b",
  宾语: "#2f80ed",
  状语: "#9b51e0",
  定语: "#eb5757",
  表语: "#2d9cdb",
  补语: "#219653",
};

function roleColor(role: string) {
  return ROLE_COLORS[role] ?? "#828282";
}
</script>
