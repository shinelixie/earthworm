export type PracticeMode = "chinese_to_english" | "dictation" | "listening";

export type PracticeDifficulty = "beginner" | "intermediate" | "advanced";

export interface LearningPathConfig {
  modes: PracticeMode[];
  difficulties: PracticeDifficulty[];
  stars: number[];
  dailyLimitsByMode: Record<string, number>;
  nodeOrder: "mode_first" | "difficulty_first";
}

export interface ModeProgressEntry {
  bestRank: string | null;
  avgOralScore: number | null;
  stars: number;
  completed: boolean;
  completionCount: number;
}

export interface CourseProgress {
  courseId: string;
  modes: Record<string, Record<string, ModeProgressEntry>>;
}

export interface LearningPathProgress {
  courses: CourseProgress[];
}

export interface DailyLimits {
  day: string;
  dailyLimitsByMode: Record<string, number>;
  todayCompletedByMode: Record<string, number>;
  remainingByMode: Record<string, number>;
}

export interface CompleteSessionPayload {
  courseId: string;
  mode: PracticeMode;
  difficulty: PracticeDifficulty;
  rank?: string;
  oralScore?: number;
  statementCount?: number;
}

export interface CompleteSessionResult {
  courseId: string;
  mode: PracticeMode;
  difficulty: PracticeDifficulty;
  rank: string;
  stars: number;
  bestRank: string;
  completed: boolean;
  remaining: number;
}
