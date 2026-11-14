<template>
  <div
    v-if="isVisible && courseStore.currentStatement?.analysis"
    class="mx-auto mb-3 w-full max-w-3xl"
  >
    <MainGrammarAnalysis :analysis="courseStore.currentStatement.analysis" />
  </div>

  <template v-if="isListeningMode()">
    <ModeListeningMode />
  </template>
  <template v-else-if="isDictationMode()">
    <ModeDictationMode />
  </template>
  <template v-else-if="isChineseToEnglishMode()">
    <ModeChineseToEnglishMode />
  </template>

  <MainLearningTimer v-if="isAuthenticated()"></MainLearningTimer>
  <MainTips />
  <MainSummary />
  <MainShare />
  <GamePauseModal v-if="isAuthenticated()"></GamePauseModal>
  <MainGameSettingModal />
</template>

<script setup lang="ts">
import { onMounted, onUnmounted } from "vue";

import GamePauseModal from "~/components/main/GamePauseModal.vue";
import { courseTimer } from "~/composables/courses/courseTimer";
import { useGrammarAnalysis } from "~/composables/main/grammarAnalysis";
import { useSessionStats } from "~/composables/main/sessionStats";
import { useGamePlayMode } from "~/composables/user/gamePlayMode";
import { isAuthenticated } from "~/services/auth";
import { useCourseStore } from "~/store/course";
import { useGameStore } from "~/store/game";

const { isChineseToEnglishMode, isDictationMode, isListeningMode } = useGamePlayMode();
const gameStore = useGameStore();
const courseStore = useCourseStore();
const { isVisible } = useGrammarAnalysis();
const { reset: resetSessionStats } = useSessionStats();

onMounted(() => {
  courseTimer.reset();
  resetSessionStats();
  gameStore.startGame();
});

onUnmounted(() => {
  gameStore.exitGame();
});
</script>
