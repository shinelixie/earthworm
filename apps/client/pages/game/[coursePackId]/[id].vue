<template>
  <div class="flex w-full flex-col pt-2">
    <template v-if="isLoading">
      <Loading></Loading>
    </template>
    <template v-else>
      <MainTool />
      <MainGame />
    </template>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useRoute } from "vue-router";
import { toast } from "vue-sonner";

import type { SplitMode, SplitStage } from "~/composables/main/splitMode";
import type { PracticeDifficulty, PracticeMode } from "~/types/models/learning-path";
import { useGameMode } from "~/composables/main/game";
import { splitStatements } from "~/composables/main/splitMode";
import { useNavigation } from "~/composables/useNavigation";
import { toGamePlayMode, useGamePlayMode } from "~/composables/user/gamePlayMode";
import { isAuthenticated } from "~/services/auth";
import { useCourseStore } from "~/store/course";
import { useCoursePackStore } from "~/store/coursePack";
import { useLearningPathStore } from "~/store/learningPath";
import { useMasteredElementsStore } from "~/store/masteredElements";
import { preventSaveStatement } from "~/store/statement";

const isLoading = ref(true);
const route = useRoute();
const coursePackStore = useCoursePackStore();
const courseStore = useCourseStore();
const masteredElementsStore = useMasteredElementsStore();
const learningPathStore = useLearningPathStore();
const { toggleGamePlayMode } = useGamePlayMode();
const { gotoCourseList } = useNavigation();
const { showQuestion } = useGameMode();

showQuestion();

onMounted(async () => {
  const { coursePackId, id } = route.params;
  const query = route.query as {
    mode?: PracticeMode;
    difficulty?: PracticeDifficulty;
    split?: SplitMode;
    stages?: string;
  };

  if (query.mode) {
    toggleGamePlayMode(toGamePlayMode(query.mode));
    learningPathStore.currentMode = query.mode;
  }
  if (query.difficulty) {
    learningPathStore.currentDifficulty = query.difficulty;
  }

  const splitMode: SplitMode = query.split ?? "sentence_only";
  const customStages = (query.stages?.split(",").filter(Boolean) ?? []) as SplitStage[];
  const isSplit = splitMode !== "sentence_only";

  if (isSplit) {
    // 拆分练习时不能沿用原课程的 statementIndex，否则会写坏真实进度
    preventSaveStatement();
  }

  if (isAuthenticated()) {
    await masteredElementsStore.setup();
  }
  await courseStore.setup(coursePackId as string, id as string, { skipAutoSave: isSplit });
  await coursePackStore.setupCoursePack(coursePackId as string);

  if (isSplit && courseStore.currentCourse) {
    courseStore.currentCourse.statements = splitStatements(
      courseStore.currentCourse.statements,
      splitMode,
      customStages,
    );
  }

  if (courseStore.isAllMastered()) {
    toast.info("你已经全部都掌握 自动帮你跳转到课程列表啦", {
      duration: 1500,
      onAutoClose: () => {
        gotoCourseList(coursePackId as string);
      },
    });
    return;
  }
  isLoading.value = false;
});
</script>
