import { createId } from "@paralleldrive/cuid2";
import {
  boolean,
  date,
  integer,
  jsonb,
  pgTable,
  real,
  text,
  timestamp,
  unique,
} from "drizzle-orm/pg-core";

/**
 * 课程包的学习路径配置（对齐线上 julebu 的 coursePackLearningPathConfig）
 * 没有记录时由服务端返回 DEFAULT_LEARNING_PATH_CONFIG，不强制落库。
 */
export const learningPathConfig = pgTable(
  "learning_path_config",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),
    coursePackId: text("course_pack_id").notNull(),
    /** 该课程包开放的练习模式，如 ["chinese_to_english","dictation","listening"] */
    modes: jsonb("modes").$type<string[]>(),
    /** 难度梯度 */
    difficulties: jsonb("difficulties").$type<string[]>(),
    /** 星级档位，默认 [1,2,3] */
    stars: jsonb("stars").$type<number[]>(),
    /** 每个模式的每日练习条数上限 */
    dailyLimitsByMode: jsonb("daily_limits_by_mode").$type<Record<string, number>>(),
    /** 学习路径节点排序：mode_first | difficulty_first */
    nodeOrder: text("node_order"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").$onUpdateFn(() => new Date()),
  },
  (t) => ({
    unq: unique().on(t.coursePackId),
  }),
);

/**
 * 用户在某课 × 模式 × 难度 下的成绩与星级
 */
export const userCourseModeProgress = pgTable(
  "user_course_mode_progress",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),
    userId: text("user_id").notNull(),
    coursePackId: text("course_pack_id").notNull(),
    courseId: text("course_id").notNull(),
    mode: text("mode").notNull(),
    difficulty: text("difficulty").notNull(),
    /** 最好评级 S/A/B/C/D */
    bestRank: text("best_rank"),
    /** 口语平均分（口语模式用，其他模式为 null） */
    avgOralScore: real("avg_oral_score"),
    /** 已获得的最高星级 0-3 */
    stars: integer("stars").notNull().default(0),
    /** 完成次数 */
    completionCount: integer("completion_count").notNull().default(0),
    completed: boolean("completed").notNull().default(false),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").$onUpdateFn(() => new Date()),
  },
  (t) => ({
    unq: unique().on(t.userId, t.courseId, t.mode, t.difficulty),
  }),
);

/**
 * 用户每日各模式练习条数（用于每日限额）
 */
export const userDailyModeActivity = pgTable(
  "user_daily_mode_activity",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),
    userId: text("user_id").notNull(),
    day: date("day", { mode: "string" }).notNull(),
    mode: text("mode").notNull(),
    completedCount: integer("completed_count").notNull().default(0),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").$onUpdateFn(() => new Date()),
  },
  (t) => ({
    unq: unique().on(t.userId, t.day, t.mode),
  }),
);
