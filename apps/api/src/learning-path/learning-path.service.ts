import { Inject, Injectable } from "@nestjs/common";
import { and, eq, sql } from "drizzle-orm";

import {
  learningPathConfig,
  userCourseModeProgress,
  userDailyModeActivity,
} from "@earthworm/schema";
import { DB, DbType } from "../global/providers/db.provider";

export const DEFAULT_LEARNING_PATH_CONFIG = {
  modes: ["chinese_to_english", "dictation", "listening"],
  difficulties: ["beginner", "intermediate", "advanced"],
  stars: [1, 2, 3],
  dailyLimitsByMode: {
    chinese_to_english: 10,
    dictation: 10,
    listening: 10,
  } as Record<string, number>,
  nodeOrder: "mode_first",
};

/** 评级从低到高，用于比较“最好评级” */
export const RANK_ORDER = ["D", "C", "B", "A", "S"] as const;
/** 评级对应的星级 */
const STARS_BY_RANK: Record<string, number> = { D: 0, C: 1, B: 2, A: 3, S: 3 };

export interface CompleteSessionInput {
  courseId: string;
  mode: string;
  difficulty: string;
  rank?: string;
  oralScore?: number;
  /** 本次练习完成的句子条数，用于累计每日限额 */
  statementCount?: number;
}

@Injectable()
export class LearningPathService {
  constructor(@Inject(DB) private db: DbType) {}

  async getConfig(coursePackId: string) {
    const row = await this.db.query.learningPathConfig.findFirst({
      where: eq(learningPathConfig.coursePackId, coursePackId),
    });

    return {
      modes: row?.modes ?? DEFAULT_LEARNING_PATH_CONFIG.modes,
      difficulties: row?.difficulties ?? DEFAULT_LEARNING_PATH_CONFIG.difficulties,
      stars: row?.stars ?? DEFAULT_LEARNING_PATH_CONFIG.stars,
      dailyLimitsByMode: row?.dailyLimitsByMode ?? DEFAULT_LEARNING_PATH_CONFIG.dailyLimitsByMode,
      nodeOrder: row?.nodeOrder ?? DEFAULT_LEARNING_PATH_CONFIG.nodeOrder,
    };
  }

  /**
   * 返回形如 julebu practice.getCoursePackLearningPathProgress 的结构：
   * { courses: [{ courseId, modes: { <mode>: { <difficulty>: {...} } } }] }
   */
  async getProgress(userId: string, coursePackId: string) {
    const rows = await this.db.query.userCourseModeProgress.findMany({
      where: and(
        eq(userCourseModeProgress.userId, userId),
        eq(userCourseModeProgress.coursePackId, coursePackId),
      ),
    });

    const byCourse = new Map<string, { courseId: string; modes: Record<string, any> }>();

    for (const row of rows) {
      if (!byCourse.has(row.courseId)) {
        byCourse.set(row.courseId, { courseId: row.courseId, modes: {} });
      }
      const course = byCourse.get(row.courseId)!;
      course.modes[row.mode] = course.modes[row.mode] ?? {};
      course.modes[row.mode][row.difficulty] = {
        bestRank: row.bestRank,
        avgOralScore: row.avgOralScore,
        stars: row.stars,
        completed: row.completed,
        completionCount: row.completionCount,
      };
    }

    return { courses: [...byCourse.values()] };
  }

  async getDailyLimits(userId: string, coursePackId: string) {
    const config = await this.getConfig(coursePackId);
    const today = this.todayInShanghai();

    const rows = await this.db.query.userDailyModeActivity.findMany({
      where: and(eq(userDailyModeActivity.userId, userId), eq(userDailyModeActivity.day, today)),
    });

    const todayCompletedByMode: Record<string, number> = {};
    for (const mode of config.modes) {
      todayCompletedByMode[mode] = 0;
    }
    for (const row of rows) {
      todayCompletedByMode[row.mode] = row.completedCount;
    }

    const remainingByMode: Record<string, number> = {};
    for (const mode of config.modes) {
      const limit = config.dailyLimitsByMode[mode] ?? 0;
      remainingByMode[mode] = Math.max(limit - (todayCompletedByMode[mode] ?? 0), 0);
    }

    return {
      day: today,
      dailyLimitsByMode: config.dailyLimitsByMode,
      todayCompletedByMode,
      remainingByMode,
    };
  }

  async completeSession(userId: string, coursePackId: string, input: CompleteSessionInput) {
    const rank = (input.rank ?? "B").toUpperCase();
    const stars = STARS_BY_RANK[rank] ?? 0;
    const statementCount = Math.max(input.statementCount ?? 1, 1);
    const today = this.todayInShanghai();

    const existing = await this.db.query.userCourseModeProgress.findFirst({
      where: and(
        eq(userCourseModeProgress.userId, userId),
        eq(userCourseModeProgress.courseId, input.courseId),
        eq(userCourseModeProgress.mode, input.mode),
        eq(userCourseModeProgress.difficulty, input.difficulty),
      ),
    });

    const bestRank = this.pickBestRank(existing?.bestRank ?? null, rank);
    const bestStars = Math.max(existing?.stars ?? 0, stars);
    const avgOralScore = this.pickAvgOralScore(existing?.avgOralScore ?? null, input.oralScore);

    if (existing) {
      await this.db
        .update(userCourseModeProgress)
        .set({
          bestRank,
          stars: bestStars,
          avgOralScore,
          completed: true,
          completionCount: (existing.completionCount ?? 0) + 1,
        })
        .where(eq(userCourseModeProgress.id, existing.id));
    } else {
      await this.db.insert(userCourseModeProgress).values({
        userId,
        coursePackId,
        courseId: input.courseId,
        mode: input.mode,
        difficulty: input.difficulty,
        bestRank,
        stars: bestStars,
        avgOralScore,
        completed: true,
        completionCount: 1,
      });
    }

    await this.db
      .insert(userDailyModeActivity)
      .values({
        userId,
        day: today,
        mode: input.mode,
        completedCount: statementCount,
      })
      .onConflictDoUpdate({
        target: [
          userDailyModeActivity.userId,
          userDailyModeActivity.day,
          userDailyModeActivity.mode,
        ],
        set: {
          completedCount: sql`user_daily_mode_activity.completed_count + ${statementCount}`,
        },
      });

    const limits = await this.getDailyLimits(userId, coursePackId);

    return {
      courseId: input.courseId,
      mode: input.mode,
      difficulty: input.difficulty,
      rank,
      stars: bestStars,
      bestRank,
      completed: true,
      remaining: limits.remainingByMode[input.mode] ?? 0,
    };
  }

  private pickBestRank(current: string | null, incoming: string) {
    if (!current) return incoming;
    const currentIndex = RANK_ORDER.indexOf(current as (typeof RANK_ORDER)[number]);
    const incomingIndex = RANK_ORDER.indexOf(incoming as (typeof RANK_ORDER)[number]);
    return incomingIndex > currentIndex ? incoming : current;
  }

  private pickAvgOralScore(current: number | null, incoming: number | undefined) {
    if (typeof incoming !== "number") return current;
    if (current == null) return incoming;
    return Math.round(((current + incoming) / 2) * 100) / 100;
  }

  private todayInShanghai() {
    const shifted = new Date(Date.now() + 8 * 60 * 60 * 1000);
    return shifted.toISOString().slice(0, 10);
  }
}
