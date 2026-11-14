export interface Statement {
  english: string;
  phonetic: string;
  chinese: string;
  /** 可选：句子语法成分分析 */
  analysis?: {
    segments: {
      role: string;
      roleEn: string;
      text: string;
      explanation: string;
      words: { text: string; phonetic: string; meaning: string; pos: string }[];
    }[];
  };
}

interface Course {
  title: string;
  description: string;
  statements: Statement[];
  learningContent: string;
}

export interface CreateCoursePack {
  title: string;
  description: string;
  cover: string;
  uId: string;
  shareLevel: string;
  courses: Course[];
}

type UpdateCourse = Course & { publishCourseId: string };

export interface UpdateCoursePack {
  title: string;
  description: string;
  cover: string;
  uId: string;
  shareLevel: string;
  courses: UpdateCourse[];
}
