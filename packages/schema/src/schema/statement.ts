import { createId } from "@paralleldrive/cuid2";
import { relations } from "drizzle-orm";
import { integer, jsonb, pgTable, text, timestamp } from "drizzle-orm/pg-core";

import { course } from "./course";

/** 句子语法成分标注（人工/离线生成，前端只负责渲染） */
export interface StatementAnalysisSegment {
  /** 中文成分名，如 主语 / 谓语 / 宾语 / 状语 */
  role: string;
  /** 英文成分名，如 subject */
  roleEn: string;
  /** 该成分对应的原文片段 */
  text: string;
  /** 讲解文案 */
  explanation: string;
  words: {
    text: string;
    phonetic: string;
    meaning: string;
    /** 词性，如 限定词 / 名词 */
    pos: string;
  }[];
}

export interface StatementAnalysis {
  segments: StatementAnalysisSegment[];
  /** 核心词表：片段练习时用于拼出该片段的中文提示 */
  glossary?: { word: string; meaning: string }[];
}

export const statement = pgTable("statements", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => createId()),
  order: integer("order").notNull(),
  chinese: text("chinese").notNull(),
  english: text("english").notNull(),
  soundmark: text("soundmark").notNull(),
  /** 语法成分分析，没标注的句子为 null */
  analysis: jsonb("analysis").$type<StatementAnalysis>(),
  courseId: text("course_id")
    .notNull()
    .references(() => course.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").$onUpdateFn(() => new Date()),
});

export const statementRelations = relations(statement, ({ one }) => ({
  course: one(course, {
    fields: [statement.courseId],
    references: [course.id],
  }),
}));
