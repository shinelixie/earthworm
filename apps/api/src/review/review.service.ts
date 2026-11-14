import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import { and, asc, eq, lte, ne, sql } from "drizzle-orm";

import { reviewCard, statement } from "@earthworm/schema";
import { DB, DbType } from "../global/providers/db.provider";

/** 复习评分：again / hard / good / easy */
export type ReviewGrade = "again" | "hard" | "good" | "easy";

const GRADUATE_INTERVAL_DAYS = 21;
const MIN_EASE = 1.3;
const MAX_EASE = 2.8;

@Injectable()
export class ReviewService {
  constructor(@Inject(DB) private db: DbType) {}

  /** 把某课程下的全部语句加入复习队列（已存在的跳过） */
  async enqueue(userId: string, coursePackId: string, courseId: string) {
    const rows = await this.db.query.statement.findMany({
      where: eq(statement.courseId, courseId),
    });

    if (rows.length === 0) {
      return { added: 0 };
    }

    const inserted = await this.db
      .insert(reviewCard)
      .values(
        rows.map((statement) => ({
          userId,
          coursePackId,
          courseId,
          statementId: statement.id,
          english: statement.english,
          chinese: statement.chinese,
        })),
      )
      .onConflictDoNothing({ target: [reviewCard.userId, reviewCard.statementId] })
      .returning({ id: reviewCard.id });

    return { added: inserted.length };
  }

  async summary(userId: string, coursePackId: string) {
    const now = new Date().toISOString();

    const [row] = await this.db
      .select({
        total: sql<number>`count(*)::int`,
        due: sql<number>`count(*) filter (where ${reviewCard.dueAt} <= ${now}::timestamp and ${reviewCard.graduated} = false)::int`,
        graduated: sql<number>`count(*) filter (where ${reviewCard.graduated} = true)::int`,
        learning: sql<number>`count(*) filter (where ${reviewCard.graduated} = false and ${reviewCard.reps} > 0)::int`,
      })
      .from(reviewCard)
      .where(and(eq(reviewCard.userId, userId), eq(reviewCard.coursePackId, coursePackId)));

    return {
      total: row?.total ?? 0,
      due: row?.due ?? 0,
      graduated: row?.graduated ?? 0,
      learning: row?.learning ?? 0,
    };
  }

  /** 每门课的卡片统计，用于课程列表角标 */
  async summaryByCourse(userId: string, coursePackId: string) {
    const now = new Date().toISOString();

    const rows = await this.db
      .select({
        courseId: reviewCard.courseId,
        total: sql<number>`count(*)::int`,
        due: sql<number>`count(*) filter (where ${reviewCard.dueAt} <= ${now}::timestamp and ${reviewCard.graduated} = false)::int`,
      })
      .from(reviewCard)
      .where(and(eq(reviewCard.userId, userId), eq(reviewCard.coursePackId, coursePackId)))
      .groupBy(reviewCard.courseId);

    return rows;
  }

  /** 到期卡片，按到期时间升序 */
  async dueCards(userId: string, coursePackId: string, limit = 20) {
    return await this.db.query.reviewCard.findMany({
      where: and(
        eq(reviewCard.userId, userId),
        eq(reviewCard.coursePackId, coursePackId),
        lte(reviewCard.dueAt, new Date()),
        ne(reviewCard.graduated, true),
      ),
      orderBy: [asc(reviewCard.dueAt)],
      limit,
    });
  }

  async grade(userId: string, cardId: string, grade: ReviewGrade) {
    const card = await this.db.query.reviewCard.findFirst({
      where: and(eq(reviewCard.id, cardId), eq(reviewCard.userId, userId)),
    });

    if (!card) {
      throw new NotFoundException("review card not found");
    }

    const next = this.schedule(card, grade);

    const [updated] = await this.db
      .update(reviewCard)
      .set(next)
      .where(eq(reviewCard.id, cardId))
      .returning();

    return updated;
  }

  /** 简化 SM-2 */
  private schedule(
    card: { reps: number; lapses: number; intervalDays: number; ease: number },
    grade: ReviewGrade,
  ) {
    const now = new Date();
    let { intervalDays, ease, reps } = card;
    let { lapses } = card;

    if (grade === "again") {
      lapses += 1;
      reps += 1;
      ease = Math.max(MIN_EASE, ease - 0.2);
      intervalDays = 0;
    } else {
      reps += 1;
      if (grade === "hard") {
        ease = Math.max(MIN_EASE, ease - 0.05);
        intervalDays = intervalDays === 0 ? 1 : Math.max(1, Math.round(intervalDays * 1.2));
      } else if (grade === "good") {
        intervalDays = intervalDays === 0 ? 1 : Math.round(intervalDays * ease);
      } else {
        ease = Math.min(MAX_EASE, ease + 0.15);
        intervalDays = intervalDays === 0 ? 2 : Math.round(intervalDays * ease * 1.3);
      }
      intervalDays = Math.min(intervalDays, 365);
    }

    const dueAt =
      grade === "again" ? now : new Date(now.getTime() + intervalDays * 24 * 60 * 60 * 1000);

    return {
      reps,
      lapses,
      ease: Math.round(ease * 100) / 100,
      intervalDays,
      dueAt,
      lastReviewAt: now,
      graduated: intervalDays >= GRADUATE_INTERVAL_DAYS,
    };
  }
}
