<template>
  <UModal
    :model-value="open"
    :ui="{ width: 'w-full sm:max-w-5xl' }"
    @update:model-value="(v: boolean) => emit('update:open', v)"
  >
    <div
      class="flex max-h-[80vh] flex-col overflow-hidden rounded-xl bg-white dark:bg-gray-900 sm:flex-row"
    >
      <!-- 左侧模式列表 -->
      <aside
        class="flex w-full shrink-0 flex-col gap-2 border-b border-gray-100 p-4 dark:border-gray-800 sm:w-64 sm:border-b-0 sm:border-r"
      >
        <button
          v-for="item in modeItems"
          :key="item.mode"
          :disabled="item.disabled || learningPathStore.remainingFor(item.mode) <= 0"
          :class="[
            'flex items-center gap-3 rounded-xl border p-3 text-left transition-all',
            selectedMode === item.mode
              ? 'border-purple-400 bg-purple-50 dark:bg-purple-900/20'
              : 'border-transparent hover:bg-gray-50 dark:hover:bg-gray-800',
            item.disabled ? 'cursor-not-allowed opacity-40' : '',
          ]"
          @click="selectMode(item.mode)"
        >
          <span class="text-2xl leading-none">{{ item.icon }}</span>
          <span class="flex-1">
            <span class="block text-sm font-semibold text-gray-800 dark:text-gray-100">
              {{ item.label }}
            </span>
            <span class="block text-xs text-gray-400">
              {{
                item.disabled ? "即将支持" : `今日剩 ${learningPathStore.remainingFor(item.mode)}`
              }}
            </span>
          </span>
        </button>
      </aside>

      <!-- 右侧配置 -->
      <section class="flex min-h-0 flex-1 flex-col">
        <div class="flex-1 overflow-y-auto p-6">
          <div class="flex flex-wrap items-baseline gap-3">
            <h2 class="text-2xl font-bold text-gray-900 dark:text-gray-50">
              {{ MODE_LABELS[selectedMode] }}模式
            </h2>
            <span class="text-sm text-gray-500">{{ modeSubtitle }}</span>
          </div>
          <p class="mt-3 text-sm text-gray-500 dark:text-gray-400">{{ modeDescription }}</p>

          <div class="mt-6 text-sm font-semibold text-gray-800 dark:text-gray-100">
            选择拆分方式
          </div>
          <div class="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <button
              v-for="option in SPLIT_OPTIONS"
              :key="option.key"
              :class="[
                'rounded-xl border px-3 py-3 text-sm transition-all',
                selectedSplit === option.key
                  ? 'border-purple-400 bg-purple-50 font-semibold text-purple-600 dark:bg-purple-900/20 dark:text-purple-300'
                  : 'border-gray-200 text-gray-600 hover:border-purple-300 dark:border-gray-700 dark:text-gray-300',
              ]"
              @click="selectSplit(option.key)"
            >
              {{ option.label }}
            </button>
          </div>

          <div class="mt-5 rounded-xl bg-gray-50 p-4 dark:bg-gray-800/60">
            <div class="flex items-center justify-between">
              <span class="text-sm font-semibold text-gray-800 dark:text-gray-100">
                {{ selectedSplitLabel }}：包含题型
              </span>
              <span class="text-xs text-gray-400">{{ selectedSplitHint }}</span>
            </div>

            <div class="mt-3 flex flex-wrap gap-2">
              <button
                v-for="stage in stageOptions"
                :key="stage.key"
                :disabled="selectedSplit !== 'custom'"
                :class="[
                  'rounded-full px-3 py-1 text-xs transition-all',
                  customStages.includes(stage.key)
                    ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-200'
                    : 'bg-gray-200 text-gray-500 dark:bg-gray-700 dark:text-gray-400',
                  selectedSplit !== 'custom' ? 'cursor-default opacity-80' : 'hover:opacity-100',
                ]"
                @click="toggleStage(stage.key)"
              >
                {{ stage.label }}
              </button>
            </div>

            <p class="mt-3 text-xs leading-relaxed text-gray-500 dark:text-gray-400">
              {{ splitDescription }}
            </p>
          </div>

          <div class="mt-5">
            <div class="mb-2 text-sm font-medium text-gray-600 dark:text-gray-300">难度</div>
            <div class="flex gap-2">
              <button
                v-for="difficulty in learningPathStore.config.difficulties"
                :key="difficulty"
                :class="[
                  'flex-1 rounded-lg border px-3 py-2 text-sm transition-all',
                  selectedDifficulty === difficulty
                    ? 'border-purple-500 bg-purple-500 text-white'
                    : 'border-gray-200 text-gray-600 hover:border-purple-300 dark:border-gray-700 dark:text-gray-300',
                ]"
                @click="selectedDifficulty = difficulty"
              >
                {{ DIFFICULTY_LABELS[difficulty] }}
              </button>
            </div>
          </div>
        </div>

        <div class="flex items-center gap-3 border-t border-gray-100 p-4 dark:border-gray-800">
          <button
            class="btn btn-ghost flex-1 sm:flex-none sm:px-8"
            @click="emit('update:open', false)"
          >
            取消
          </button>
          <button
            class="btn flex-1 border-none bg-purple-500 text-white hover:bg-purple-600 sm:flex-none sm:px-16"
            :disabled="learningPathStore.remainingFor(selectedMode) <= 0"
            @click="handleStart"
          >
            开始练习
          </button>
        </div>
      </section>
    </div>
  </UModal>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";

import type { SplitMode, SplitStage } from "~/composables/main/splitMode";
import type { PracticeDifficulty, PracticeMode } from "~/types/models/learning-path";
import { SPLIT_OPTIONS, stageOptionsFor } from "~/composables/main/splitMode";
import {
  DIFFICULTY_LABELS,
  MODE_DESCRIPTIONS,
  MODE_LABELS,
  useLearningPathStore,
} from "~/store/learningPath";

const props = defineProps<{
  open: boolean;
  coursePackId: string;
  courseId: string;
  courseTitle?: string;
}>();

const emit = defineEmits<{
  (e: "update:open", value: boolean): void;
  (
    e: "start",
    payload: {
      mode: PracticeMode;
      difficulty: PracticeDifficulty;
      splitMode: SplitMode;
      customStages: SplitStage[];
    },
  ): void;
}>();

const learningPathStore = useLearningPathStore();

const MODE_ICONS: Record<string, string> = {
  chinese_to_english: "🀄",
  dictation: "✍️",
  listening: "🎧",
  talking: "🎤",
  reading: "📖",
};

const selectedMode = ref<PracticeMode>(learningPathStore.currentMode);
const selectedDifficulty = ref<PracticeDifficulty>(learningPathStore.currentDifficulty);
const selectedSplit = ref<SplitMode>("word_first");
const customStages = ref<SplitStage[]>(["phrase", "core_chunk", "combo_chunk", "full_sentence"]);

const modeItems = computed(() => {
  const enabled = learningPathStore.config.modes.map((mode) => ({
    mode,
    label: MODE_LABELS[mode],
    icon: MODE_ICONS[mode] ?? "📘",
    disabled: false,
  }));
  const coming = [
    { mode: "talking" as PracticeMode, label: "口语评测模式", icon: "🎤", disabled: true },
    { mode: "reading" as PracticeMode, label: "阅读模式", icon: "📖", disabled: true },
  ];
  return [...enabled, ...coming];
});

const modeSubtitle = computed(() => {
  switch (selectedMode.value) {
    case "dictation":
      return "听发音 + 看中文写英文";
    case "listening":
      return "只听发音写英文";
    default:
      return "看中文写英文";
  }
});

const modeDescription = computed(() => MODE_DESCRIPTIONS[selectedMode.value]);

const selectedSplitLabel = computed(
  () => SPLIT_OPTIONS.find((option) => option.key === selectedSplit.value)?.label ?? "",
);
const selectedSplitHint = computed(
  () => SPLIT_OPTIONS.find((option) => option.key === selectedSplit.value)?.hint ?? "",
);
const splitDescription = computed(
  () => SPLIT_OPTIONS.find((option) => option.key === selectedSplit.value)?.description ?? "",
);
const stageOptions = computed(() => stageOptionsFor(selectedSplit.value));

watch(
  () => props.open,
  (open) => {
    if (!open) return;
    selectedMode.value = learningPathStore.currentMode;
    selectedDifficulty.value = learningPathStore.currentDifficulty;
    const cached = localStorage.getItem("splitMode") as SplitMode | null;
    if (cached && SPLIT_OPTIONS.some((option) => option.key === cached)) {
      selectedSplit.value = cached;
    }
  },
);

function selectMode(mode: PracticeMode) {
  selectedMode.value = mode;
}

function selectSplit(key: SplitMode) {
  selectedSplit.value = key;
  localStorage.setItem("splitMode", key);
  if (key !== "custom") {
    customStages.value = stageOptionsFor(key)
      .filter((stage) => stage.enabled)
      .map((stage) => stage.key);
  }
}

function toggleStage(stage: SplitStage) {
  if (selectedSplit.value !== "custom") return;
  const index = customStages.value.indexOf(stage);
  if (index >= 0) {
    if (customStages.value.length === 1) return;
    customStages.value.splice(index, 1);
  } else {
    customStages.value.push(stage);
  }
}

function handleStart() {
  learningPathStore.setSelection(selectedMode.value, selectedDifficulty.value);
  emit("start", {
    mode: selectedMode.value,
    difficulty: selectedDifficulty.value,
    splitMode: selectedSplit.value,
    customStages: [...customStages.value],
  });
  emit("update:open", false);
}
</script>
