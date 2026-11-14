<template>
  <div class="flex w-full flex-col">
    <template v-if="isLoading">
      <Loading></Loading>
    </template>

    <template v-else>
      <h2 class="mb-4 text-center text-3xl dark:border-gray-600">
        {{ coursePackStore.currentCoursePack?.title }}
      </h2>

      <div
        v-if="isAuthenticated()"
        class="mb-3 flex flex-wrap items-center justify-center gap-3 text-xs text-gray-500 dark:text-gray-400"
      >
        <NuxtLink
          :to="`/path/${coursePackId}`"
          class="rounded-full bg-gray-100 px-3 py-1 transition-colors hover:text-purple-500 dark:bg-gray-800"
        >
          学习路径
        </NuxtLink>
        <NuxtLink
          v-if="reviewStore.summary.total > 0"
          :to="`/review/${coursePackId}`"
          :class="[
            'rounded-full px-3 py-1 transition-colors',
            reviewStore.summary.due > 0
              ? 'bg-purple-500 text-white hover:bg-purple-600'
              : 'bg-gray-100 dark:bg-gray-800',
          ]"
        >
          复习
          <span class="font-semibold">{{ reviewStore.summary.due }}</span>
          张到期 / 共 {{ reviewStore.summary.total }}
        </NuxtLink>
        <span
          v-for="mode in learningPathStore.config.modes"
          :key="mode"
          class="rounded-full bg-gray-100 px-3 py-1 dark:bg-gray-800"
        >
          {{ MODE_LABELS[mode] }} 今日剩
          <span class="font-semibold text-purple-500">{{
            learningPathStore.remainingFor(mode)
          }}</span>
        </span>
      </div>

      <div class="h-full scrollbar-hide">
        <div
          class="grid h-[79vh] grid-cols-1 justify-start gap-8 overflow-y-auto overflow-x-hidden pb-96 pl-0 pr-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
        >
          <template
            v-for="course in coursePackStore.currentCoursePack?.courses"
            :key="course.id"
          >
            <CoursesCourseCard
              :title="course.title"
              :description="course.description"
              :id="course.id"
              :count="course.completionCount"
              :coursePackId="course.coursePackId"
              :stars="learningPathStore.starsFor(course.id)"
              @click="handleChangeCourse(course.id)"
            />
          </template>
        </div>
      </div>
    </template>

    <ModeSelectDialog
      v-model:open="isModeDialogOpen"
      :course-pack-id="coursePackId"
      :course-id="pendingCourseId"
      :course-title="pendingCourseTitle"
      @start="handleStartPractice"
    />
  </div>
</template>

<script setup lang="ts">
import { navigateTo } from "#app";
import { computed, ref } from "vue";
import { useRoute } from "vue-router";

import type { SplitMode, SplitStage } from "~/composables/main/splitMode";
import type { PracticeDifficulty, PracticeMode } from "~/types/models/learning-path";
import { useActiveCourseMap } from "~/composables/courses/activeCourse";
import { isAuthenticated } from "~/services/auth";
import { useCoursePackStore } from "~/store/coursePack";
import { MODE_LABELS, useLearningPathStore } from "~/store/learningPath";
import { useReviewStore } from "~/store/review";

const isLoading = ref(false);
const route = useRoute();
const coursePackStore = useCoursePackStore();
const learningPathStore = useLearningPathStore();
const reviewStore = useReviewStore();
const coursePackId = route.params.id as string;
const { updateActiveCourseMap } = useActiveCourseMap();

const isModeDialogOpen = ref(false);
const pendingCourseId = ref("");
const pendingCourseTitle = computed(
  () =>
    coursePackStore.currentCoursePack?.courses.find((course) => course.id === pendingCourseId.value)
      ?.title ?? "",
);

setup();

async function setup() {
  isLoading.value = true;
  await coursePackStore.setupCoursePack(coursePackId);
  if (isAuthenticated()) {
    await learningPathStore.setup(coursePackId);
    await reviewStore.refreshSummary(coursePackId);
  }
  isLoading.value = false;
}

function handleChangeCourse(courseId: string) {
  pendingCourseId.value = courseId;
  if (!isAuthenticated()) {
    gotoGame(courseId, "chinese_to_english", "beginner");
    return;
  }
  isModeDialogOpen.value = true;
}

function handleStartPractice(payload: {
  mode: PracticeMode;
  difficulty: PracticeDifficulty;
  splitMode: SplitMode;
  customStages: SplitStage[];
}) {
  gotoGame(
    pendingCourseId.value,
    payload.mode,
    payload.difficulty,
    payload.splitMode,
    payload.customStages,
  );
}

function gotoGame(
  courseId: string,
  mode: PracticeMode,
  difficulty: PracticeDifficulty,
  splitMode: SplitMode = "sentence_only",
  customStages: SplitStage[] = [],
) {
  updateActiveCourseMap(coursePackId, courseId);
  const params = new URLSearchParams({ mode, difficulty, split: splitMode });
  if (splitMode === "custom") {
    params.set("stages", customStages.join(","));
  }
  navigateTo(`/game/${coursePackId}/${courseId}?${params.toString()}`);
}
</script>

<style></style>
