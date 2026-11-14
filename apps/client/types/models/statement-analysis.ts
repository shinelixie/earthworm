export interface AnalysisWord {
  text: string;
  phonetic: string;
  meaning: string;
  pos: string;
}

export interface AnalysisSegment {
  role: string;
  roleEn: string;
  text: string;
  explanation: string;
  words: AnalysisWord[];
}

export interface AnalysisGlossaryEntry {
  word: string;
  meaning: string;
}

export interface StatementAnalysis {
  segments: AnalysisSegment[];
  /** 核心词表：单词 -> 中文释义，用于拆分练习时给片段拼中文提示 */
  glossary?: AnalysisGlossaryEntry[];
}
