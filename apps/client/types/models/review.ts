export type ReviewGrade = "again" | "hard" | "good" | "easy";

export interface ReviewCard {
  id: string;
  coursePackId: string;
  courseId: string;
  statementId: string;
  english: string;
  chinese: string;
  reps: number;
  lapses: number;
  intervalDays: number;
  ease: number;
  dueAt: string;
  lastReviewAt: string | null;
  graduated: boolean;
}

export interface ReviewSummary {
  total: number;
  due: number;
  graduated: number;
  learning: number;
}

export interface ReviewCourseSummary {
  courseId: string;
  total: number;
  due: number;
}
