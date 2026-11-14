<template>
  <div class="mx-auto flex w-full max-w-5xl flex-col gap-4 px-4 py-6">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold dark:text-gray-100">学习路径</h1>
        <p class="mt-1 text-sm text-gray-500">
          {{ coursePackStore.currentCoursePack?.title }} · 按「模式 → 难度 → 星级」推进
        </p>
      </div>
      <NuxtLink
        :to="`/course-pack/${coursePackId}`"
        class="text-sm text-gray-500 hover:text-purple-500"
      >
        返回课程
      </NuxtLink>
    </div>

    <div
      v-if="isLoading"
      class="py-16 text-center text-gray-500"
    >
      加载中…
    </div>

    <template v-else>
      <div class="flex flex-wrap items-center gap-4 text-xs text-gray-500">
        <span class="rounded-full bg-amber-50 px-3 py-1 text-amber-600 dark:bg-amber-900/20">
          已得 {{ totalStars }} / {{ maxStars }} 星
        </span>
        <span
          >节点排序：{{
            learningPathStore.config.nodeOrder === "mode_first" ? "模式优先" : "难度优先"
          }}</span
        >
      </div>

      <div class="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700">
        <table class="w-full min-w-[720px] border-collapse text-sm">
          <thead>
            <tr class="bg-gray-50 dark:bg-gray-800">
              <th
                rowspan="2"
                class="border-b border-gray-200 px-4 py-2 text-left font-medium dark:border-gray-700"
              >
                课程
              </th>
              <th
                v-for="mode in learningPathStore.config.modes"
                :key="mode"
                :colspan="learningPathStore.config.difficulties.length"
                class="border-b border-l border-gray-200 px-3 py-2 font-medium dark:border-gray-700"
              >
                {{ MODE_LABELS[mode] }}
              </th>
            </tr>
            <tr class="bg-gray-50 text-xs text-gray-500 dark:bg-gray-800">
              <template
                v-for="mode in learningPathStore.config.modes"
                :key="`${mode}-sub`"
              >
                <th
                  v-for="difficulty in learningPathStore.config.difficulties"
                  :key="`${mode}-${difficulty}`"
                  class="border-b border-l border-gray-200 px-2 py-1 font-normal dark:border-gray-700"
                >
                  {{ DIFFICULTY_LABELS[difficulty] }}
                </th>
              </template>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="course in courses"
              :key="course.id"
              class="hover:bg-gray-50 dark:hover:bg-gray-800/50"
            >
              <td class="border-b border-gray-100 px-4 py-2 dark:border-gray-800">
                {{ course.title }}
              </td>
              <template
                v-for="mode in learningPathStore.config.modes"
                :key="`${course.id}-${mode}`"
              >
                <td
                  v-for="difficulty in learningPathStore.config.difficulties"
                  :key="`${course.id}-${mode}-${difficulty}`"
                  class="cursor-pointer border-b border-l border-gray-100 px-2 py-2 text-center dark:border-gray-800"
                  @click="startCourse(course.id, mode, difficulty)"
                >
                  <span
                    :class="[
                      'text-base',
                      starsFor(course.id, mode, difficulty) > 0
                        ? 'text-amber-500'
                        : 'text-gray-300',
                    ]"
                  >
                    {{ starText(starsFor(course.id, mode, difficulty)) }}
                  </span>
                </td>
              </template>
            </tr>
          </tbody>
        </table>
      </div>

      <p class="text-xs text-gray-400">
        点击任意格子直接进入该「课程 × 模式 × 难度」的练习；额度用完的模式会被拦截。
      </p>
    </template>
  </div>
</template>

<script setup lang="ts">
import { navigateTo } from "#app";
import { computed, ref } from "vue";
import { useRoute } from "vue-router";

import type { PracticeDifficulty, PracticeMode } from "~/types/models/learning-path";
import { isAuthenticated } from "~/services/auth";
import { useCoursePackStore } from "~/store/coursePack";
import { DIFFICULTY_LABELS, MODE_LABELS, useLearningPathStore } from "~/store/learningPath";

const route = useRoute();
const coursePackId = route.params.coursePackId as string;
const coursePackStore = useCoursePackStore();
const learningPathStore = useLearningPathStore();

const isLoading = ref(true);

const courses = computed(() => coursePackStore.currentCoursePack?.courses ?? []);

const maxStars = computed(
  () =>
    courses.value.length *
    learningPathStore.config.modes.length *
    learningPathStore.config.difficulties.length *
    3,
);

const totalStars = computed(() => {
  let sum = 0;
  for (const course of courses.value) {
    for (const mode of learningPathStore.config.modes) {
      for (const difficulty of learningPathStore.config.difficulties) {
        sum += starsFor(course.id, mode, difficulty);
      }
    }
  }
  return sum;
});

function starsFor(courseId: string, mode: PracticeMode, difficulty: PracticeDifficulty) {
  return learningPathStore.entryFor(courseId, mode, difficulty)?.stars ?? 0;
}

function starText(stars: number) {
  return `${"★".repeat(stars)}${"☆".repeat(Math.max(3 - stars, 0))}`;
}

function startCourse(courseId: string, mode: PracticeMode, difficulty: PracticeDifficulty) {
  if (!isAuthenticated()) {
    navigateTo(`/game/${coursePackId}/${courseId}?mode=${mode}&difficulty=${difficulty}`);
    return;
  }
  if (learningPathStore.remainingFor(mode) <= 0) {
    return;
  }
  learningPathStore.setSelection(mode, difficulty);
  navigateTo(`/game/${coursePackId}/${courseId}?mode=${mode}&difficulty=${difficulty}`);
}

async function setup() {
  isLoading.value = true;
  await coursePackStore.setupCoursePack(coursePackId);
  if (isAuthenticated()) {
    await learningPathStore.setup(coursePackId);
  }
  isLoading.value = false;
}

setup();
</script>
