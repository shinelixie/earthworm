import { createId } from "@paralleldrive/cuid2";
import { boolean, integer, pgTable, real, text, timestamp, unique } from "drizzle-orm/pg-core";

/**
 * 复习卡片（对齐线上 julebu 的 practiceReview 体系）
 * 每张卡对应一条语句，按简化 SM-2 算法计算下次到期时间。
 */
export const reviewCard = pgTable(
  "review_card",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),
    userId: text("user_id").notNull(),
    coursePackId: text("course_pack_id").notNull(),
    courseId: text("course_id").notNull(),
    statementId: text("statement_id").notNull(),
    english: text("english").notNull(),
    chinese: text("chinese").notNull(),
    /** 复习次数 */
    reps: integer("reps").notNull().default(0),
    /** 遗忘次数 */
    lapses: integer("lapses").notNull().default(0),
    /** 当前间隔（天） */
    intervalDays: integer("interval_days").notNull().default(0),
    /** 难度因子 */
    ease: real("ease").notNull().default(2.5),
    dueAt: timestamp("due_at").notNull().defaultNow(),
    lastReviewAt: timestamp("last_review_at"),
    /** 间隔达到毕业阈值后不再进入队列 */
    graduated: boolean("graduated").notNull().default(false),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").$onUpdateFn(() => new Date()),
  },
  (t) => ({
    unq: unique().on(t.userId, t.statementId),
  }),
);
