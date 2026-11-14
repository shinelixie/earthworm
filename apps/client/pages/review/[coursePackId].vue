<template>
  <div class="mx-auto flex w-full max-w-3xl flex-col gap-4 px-4 py-6">
    <div class="flex items-center justify-between">
      <h1 class="text-2xl font-bold dark:text-gray-100">复习</h1>
      <NuxtLink
        :to="`/course-pack/${coursePackId}`"
        class="text-sm text-gray-500 hover:text-purple-500"
      >
        返回课程列表
      </NuxtLink>
    </div>

    <div
      v-if="reviewStore.isLoading"
      class="py-16 text-center text-gray-500"
    >
      加载中…
    </div>

    <template v-else>
      <div
        v-if="!reviewStore.currentCard && !reviewStore.isFinished"
        class="flex flex-col items-center gap-4 py-16"
      >
        <div class="text-lg text-gray-600 dark:text-gray-300">
          {{ emptyText }}
        </div>
        <div class="text-sm text-gray-400">
          总卡片 {{ reviewStore.summary.total }} · 已毕业 {{ reviewStore.summary.graduated }} · 到期
          {{ reviewStore.summary.due }}
        </div>
        <button
          class="btn btn-primary"
          :disabled="reviewStore.summary.due === 0"
          @click="startAgain"
        >
          再查一次
        </button>
      </div>

      <div
        v-else-if="reviewStore.isFinished"
        class="flex flex-col items-center gap-4 py-16"
      >
        <div class="text-2xl">🎉 本轮复习完成</div>
        <div class="text-sm text-gray-500">共复习 {{ reviewedCount }} 张卡片</div>
        <div class="flex gap-2">
          <button
            class="btn"
            @click="reload"
          >
            继续复习
          </button>
          <NuxtLink
            class="btn btn-primary"
            :to="`/course-pack/${coursePackId}`"
          >
            回到课程
          </NuxtLink>
        </div>
      </div>

      <template v-else>
        <div class="flex items-center gap-3 text-sm text-gray-500">
          <span>{{ reviewStore.currentIndex + 1 }} / {{ reviewStore.cards.length }}</span>
          <div class="h-2 flex-1 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
            <div
              class="h-full bg-purple-500 transition-all"
              :style="{ width: `${reviewStore.progress}%` }"
            ></div>
          </div>
          <span>复习 {{ reviewStore.currentCard?.reps ?? 0 }} 次</span>
        </div>

        <div class="rounded-xl border border-gray-300 p-6 dark:border-gray-600">
          <div class="min-h-[64px] text-center text-xl dark:text-gray-100">
            {{ reviewStore.currentCard?.chinese }}
          </div>

          <input
            v-model="answer"
            :disabled="revealed"
            class="mt-6 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-3 text-lg outline-none focus:border-purple-500 dark:border-gray-600 dark:text-gray-100"
            placeholder="敲出英文句子，回车提交"
            @keyup.enter="handleSubmit"
          />

          <div
            v-if="revealed"
            :class="[
              'mt-4 rounded-lg px-4 py-3 text-sm',
              isCorrect
                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300'
                : 'bg-rose-50 text-rose-700 dark:bg-rose-900/20 dark:text-rose-300',
            ]"
          >
            <div class="font-medium">
              {{ isCorrect ? "回答正确" : "正确答案" }}
            </div>
            <div class="mt-1">{{ reviewStore.currentCard?.english }}</div>
          </div>

          <div class="mt-6 flex justify-end">
            <button
              v-if="!revealed"
              class="btn btn-primary"
              @click="handleSubmit"
            >
              提交
            </button>
          </div>
        </div>

        <div
          v-if="revealed"
          class="grid grid-cols-2 gap-2 sm:grid-cols-4"
        >
          <button
            v-for="grade in grades"
            :key="grade"
            class="btn"
            @click="handleGrade(grade)"
          >
            {{ GRADE_LABELS[grade] }}
          </button>
        </div>
      </template>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { useRoute } from "vue-router";

import type { ReviewGrade } from "~/types/models/review";
import { GRADE_LABELS, useReviewStore } from "~/store/review";

const route = useRoute();
const coursePackId = route.params.coursePackId as string;
const reviewStore = useReviewStore();

const grades: ReviewGrade[] = ["again", "hard", "good", "easy"];
const answer = ref("");
const revealed = ref(false);
const reviewedCount = ref(0);

const emptyText = computed(() =>
  reviewStore.summary.total === 0
    ? "还没有复习卡片，先完成一次课程练习吧"
    : "当前没有到期的复习卡片",
);

const isCorrect = computed(
  () => normalize(answer.value) === normalize(reviewStore.currentCard?.english ?? ""),
);

function normalize(text: string) {
  return text
    .toLocaleLowerCase()
    .replace(/[‘’“”]/g, "'")
    .replace(/[.,!?;:]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function handleSubmit() {
  if (revealed.value) return;
  if (!answer.value.trim()) return;
  revealed.value = true;
}

async function handleGrade(grade: ReviewGrade) {
  await reviewStore.gradeCard(grade);
  reviewedCount.value += 1;
  answer.value = "";
  revealed.value = false;
}

function reload() {
  reviewStore.reset();
  reviewedCount.value = 0;
  reviewStore.load(coursePackId);
}

function startAgain() {
  reload();
}

reload();
</script>
