import { defineStore } from "pinia";
import { computed, ref } from "vue";

import type {
  DailyLimits,
  LearningPathConfig,
  LearningPathProgress,
  PracticeDifficulty,
  PracticeMode,
} from "~/types/models/learning-path";
import {
  fetchDailyLimits,
  fetchLearningPathConfig,
  fetchLearningPathProgress,
} from "~/api/learning-path";
import { isAuthenticated } from "~/services/auth";

export const MODE_LABELS: Record<PracticeMode, string> = {
  chinese_to_english: "中译英",
  dictation: "听写",
  listening: "听力",
};

export const MODE_DESCRIPTIONS: Record<PracticeMode, string> = {
  chinese_to_english: "看中文，敲出英文句子",
  dictation: "听发音 + 看中文，敲出英文句子",
  listening: "只听发音，敲出英文句子",
};

export const DIFFICULTY_LABELS: Record<PracticeDifficulty, string> = {
  beginner: "入门",
  intermediate: "进阶",
  advanced: "高阶",
};

export const DIFFICULTY_DESCRIPTIONS: Record<PracticeDifficulty, string> = {
  beginner: "节奏宽松，容错高",
  intermediate: "标准节奏",
  advanced: "节奏紧凑，评级要求更高",
};

const DEFAULT_CONFIG: LearningPathConfig = {
  modes: ["chinese_to_english", "dictation", "listening"],
  difficulties: ["beginner", "intermediate", "advanced"],
  stars: [1, 2, 3],
  dailyLimitsByMode: { chinese_to_english: 10, dictation: 10, listening: 10 },
  nodeOrder: "mode_first",
};

export const useLearningPathStore = defineStore("learningPath", () => {
  const config = ref<LearningPathConfig>({ ...DEFAULT_CONFIG });
  const progress = ref<LearningPathProgress>({ courses: [] });
  const dailyLimits = ref<DailyLimits | null>(null);

  const currentMode = ref<PracticeMode>("chinese_to_english");
  const currentDifficulty = ref<PracticeDifficulty>("beginner");

  const progressByCourse = computed(() => {
    const map: Record<string, Record<string, Record<string, any>>> = {};
    for (const course of progress.value.courses) {
      map[course.courseId] = course.modes;
    }
    return map;
  });

  async function setup(coursePackId: string) {
    if (!isAuthenticated()) {
      config.value = { ...DEFAULT_CONFIG };
      return;
    }
    const [nextConfig, nextProgress, nextLimits] = await Promise.all([
      fetchLearningPathConfig(coursePackId),
      fetchLearningPathProgress(coursePackId),
      fetchDailyLimits(coursePackId),
    ]);
    config.value = nextConfig;
    progress.value = nextProgress;
    dailyLimits.value = nextLimits;
  }

  async function refreshLimits(coursePackId: string) {
    if (!isAuthenticated()) return;
    dailyLimits.value = await fetchDailyLimits(coursePackId);
  }

  /** 某课在某模式下已获得的最高星级（跨难度取最大） */
  function starsFor(courseId: string, mode?: PracticeMode) {
    const courseModes = progressByCourse.value[courseId];
    if (!courseModes) return 0;

    const modeKeys = mode ? [mode] : Object.keys(courseModes);
    let best = 0;
    for (const key of modeKeys) {
      const byDifficulty = courseModes[key];
      if (!byDifficulty) continue;
      for (const entry of Object.values(byDifficulty)) {
        best = Math.max(best, (entry as any).stars ?? 0);
      }
    }
    return best;
  }

  function entryFor(courseId: string, mode: PracticeMode, difficulty: PracticeDifficulty) {
    return progressByCourse.value[courseId]?.[mode]?.[difficulty] ?? null;
  }

  function remainingFor(mode: PracticeMode) {
    if (!isAuthenticated()) return Infinity;
    return (
      dailyLimits.value?.remainingByMode?.[mode] ?? config.value.dailyLimitsByMode?.[mode] ?? 0
    );
  }

  function limitFor(mode: PracticeMode) {
    return config.value.dailyLimitsByMode?.[mode] ?? 0;
  }

  function setSelection(mode: PracticeMode, difficulty: PracticeDifficulty) {
    currentMode.value = mode;
    currentDifficulty.value = difficulty;
  }

  return {
    config,
    progress,
    dailyLimits,
    currentMode,
    currentDifficulty,
    progressByCourse,
    setup,
    refreshLimits,
    starsFor,
    entryFor,
    remainingFor,
    limitFor,
    setSelection,
  };
});
