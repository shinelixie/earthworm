import type { CourseApiResponse, StatementApiResponse } from "~/api/course";

export interface Statement extends StatementApiResponse {
  /** 拆分练习时的位置提示，如「第 2 个语块（共 5 段）」 */
  hint?: string;
  /** 是否是拆分出来的片段 */
  isFragment?: boolean;
}
export interface Course extends CourseApiResponse {
  statements: Statement[];
}
