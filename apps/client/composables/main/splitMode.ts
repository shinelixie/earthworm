import type { Statement } from "~/types";

/** 拆分方式（对齐 julebu 的「选择拆分方式」） */
export type SplitMode = "custom" | "word_first" | "chunk_first" | "sentence_only";

/** 包含题型（勾选维度） */
export type SplitStage = "phrase" | "core_chunk" | "combo_chunk" | "full_sentence";

export interface SplitOption {
  key: SplitMode;
  label: string;
  hint: string;
  description: string;
  stages: SplitStage[];
  badge?: string;
}

export const SPLIT_OPTIONS: SplitOption[] = [
  {
    key: "custom",
    label: "自定义",
    hint: "自己勾选题型",
    description: "自己决定练哪几层，适合已有明确弱项的时候。",
    stages: ["phrase", "core_chunk", "combo_chunk", "full_sentence"],
  },
  {
    key: "word_first",
    label: "从单词练",
    hint: "适合新课初学",
    description: "从单词和短语基础开始，层层递进到整句输出，梯度平缓无压力。",
    stages: ["phrase", "core_chunk", "combo_chunk", "full_sentence"],
  },
  {
    key: "chunk_first",
    label: "从语块练",
    hint: "适合有一定基础",
    description: "按语块逐段攻克，再连成整句，重点练句子结构。",
    stages: ["core_chunk", "combo_chunk", "full_sentence"],
  },
  {
    key: "sentence_only",
    label: "只练整句",
    hint: "适合冲刺复习",
    description: "跳过拆分，直接整句输出，最快节奏。",
    stages: ["full_sentence"],
  },
];

export const STAGE_LABELS: Record<SplitStage, string> = {
  phrase: "短语单词",
  core_chunk: "核心语块",
  combo_chunk: "组合语块",
  full_sentence: "完整句子",
};

const STAGE_ORDER: SplitStage[] = ["phrase", "core_chunk", "combo_chunk", "full_sentence"];

/** 语块切分：遇到介词/连词/关系词或标点处断开 */
const BREAK_BEFORE = new Set([
  "of",
  "in",
  "on",
  "at",
  "from",
  "by",
  "with",
  "for",
  "to",
  "that",
  "which",
  "who",
  "whom",
  "whose",
  "because",
  "although",
  "though",
  "while",
  "when",
  "if",
  "as",
  "and",
  "but",
  "or",
  "so",
  "than",
  "over",
  "under",
  "between",
  "among",
  "during",
  "after",
  "before",
  "into",
  "about",
  "through",
  "against",
  "despite",
  "where",
]);

export function chunkSentence(sentence: string): string[] {
  const tokens = sentence.split(/\s+/).filter(Boolean);
  if (tokens.length <= 3) return [sentence.trim()];

  const chunks: string[] = [];
  let current: string[] = [];

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    const bare = token.toLowerCase().replace(/[^a-z']/g, "");
    const prev = tokens[i - 1] ?? "";
    const breakHere = current.length > 0 && (BREAK_BEFORE.has(bare) || /[,;:]$/.test(prev));

    if (breakHere) {
      chunks.push(current.join(" "));
      current = [];
    }
    current.push(token);
  }
  if (current.length) chunks.push(current.join(" "));

  return chunks.filter(Boolean);
}

export interface PracticeItem extends Statement {
  /** 这一题在整句中的位置提示 */
  hint?: string;
  /** 是否是拆分出来的片段（非整句） */
  isFragment?: boolean;
}

function stagesFor(mode: SplitMode, customStages: SplitStage[]): SplitStage[] {
  if (mode === "custom") {
    return STAGE_ORDER.filter((stage) => customStages.includes(stage));
  }
  const option = SPLIT_OPTIONS.find((item) => item.key === mode);
  return option ? option.stages : ["full_sentence"];
}

function normalizeWord(raw: string) {
  return raw
    .toLowerCase()
    .replace(/[’']s$/, "")
    .replace(/^[^a-z]+|[^a-z]+$/g, "");
}

/**
 * 用书内「核心词表」给片段拼中文提示。
 * 只取该片段里出现、且词表有释义的词，按出现顺序去重后连接。
 */
function fragmentChineseFor(
  analysis: Statement["analysis"] | undefined,
  words: string[],
): string | undefined {
  const glossary = analysis?.glossary ?? [];
  if (glossary.length === 0) return undefined;

  const dict = new Map<string, string>();
  for (const entry of glossary) {
    dict.set(normalizeWord(entry.word), entry.meaning);
  }

  const meanings: string[] = [];
  for (const word of words) {
    const meaning = dict.get(normalizeWord(word));
    if (meaning && !meanings.includes(meaning)) meanings.push(meaning);
  }

  return meanings.length > 0 ? meanings.join("；") : undefined;
}

/**
 * 把整句拆成一组递进的练习项。
 * 整句永远排在最后一项，保证练完能看到完整句子。
 * 片段项的中文只显示该片段自身的释义（来自核心词表），不暴露整句译文。
 */
export function splitStatements(
  statements: Statement[],
  mode: SplitMode,
  customStages: SplitStage[] = [],
): PracticeItem[] {
  if (mode === "sentence_only") {
    return statements.map((statement) => ({
      ...statement,
      hint: "完整句子",
      isFragment: false,
    }));
  }

  const stages = stagesFor(mode, customStages);
  const result: PracticeItem[] = [];

  for (const statement of statements) {
    const full = statement.english;
    const words = full.split(/\s+/).filter(Boolean);
    const chunks = chunkSentence(full);
    const fragments: {
      text: string;
      hint: string;
      isFragment: boolean;
      chinese?: string;
    }[] = [];

    if (stages.includes("phrase")) {
      for (const count of [2, 3, 4]) {
        if (words.length <= count) break;
        const slice = words.slice(0, count);
        fragments.push({
          text: slice.join(" "),
          hint: `前 ${count} 个单词`,
          isFragment: true,
          chinese: fragmentChineseFor(statement.analysis, slice),
        });
      }
    }

    if (stages.includes("core_chunk")) {
      chunks.forEach((chunk, index) => {
        fragments.push({
          text: chunk,
          hint: `第 ${index + 1} 个语块（共 ${chunks.length} 段）`,
          isFragment: true,
          chinese: fragmentChineseFor(statement.analysis, chunk.split(/\s+/)),
        });
      });
    }

    if (stages.includes("combo_chunk")) {
      for (let count = 2; count < chunks.length; count++) {
        const text = chunks.slice(0, count).join(" ");
        fragments.push({
          text,
          hint: `前 ${count} 个语块`,
          isFragment: true,
          chinese: fragmentChineseFor(statement.analysis, text.split(/\s+/)),
        });
      }
    }

    const seen = new Set<string>();
    let order = 0;
    for (const fragment of fragments) {
      const key = fragment.text.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      result.push({
        ...statement,
        id: `${statement.id}-f${order}`,
        order: order + 1,
        english: fragment.text,
        chinese: fragment.chinese ?? "",
        isMastered: false,
        hint: fragment.hint,
        isFragment: true,
      });
      order += 1;
    }

    if (stages.includes("full_sentence")) {
      result.push({
        ...statement,
        order: order + 1,
        isMastered: false,
        hint: "完整句子",
        isFragment: false,
      });
    }
  }

  return result;
}

/** 生成「包含题型」列表，供自定义勾选 */
export function stageOptionsFor(mode: SplitMode) {
  const option = SPLIT_OPTIONS.find((item) => item.key === mode);
  const enabled = new Set(option?.stages ?? ["full_sentence"]);
  return STAGE_ORDER.map((stage) => ({
    key: stage,
    label: STAGE_LABELS[stage],
    enabled: enabled.has(stage),
  }));
}
