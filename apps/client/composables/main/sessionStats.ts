import { computed, ref } from "vue";

/**
 * 单次练习的作答统计，用于真实评级（正确率）。
 * 模块级状态，进入课程时 reset。
 */
const correctCount = ref(0);
const wrongCount = ref(0);

export function useSessionStats() {
  function recordCorrect() {
    correctCount.value += 1;
  }

  function recordWrong() {
    wrongCount.value += 1;
  }

  function reset() {
    correctCount.value = 0;
    wrongCount.value = 0;
  }

  const totalAttempts = computed(() => correctCount.value + wrongCount.value);

  const accuracy = computed(() =>
    totalAttempts.value === 0 ? 1 : correctCount.value / totalAttempts.value,
  );

  return {
    correctCount,
    wrongCount,
    totalAttempts,
    accuracy,
    recordCorrect,
    recordWrong,
    reset,
  };
}
