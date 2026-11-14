import { describe, expect, it } from "vitest";

import type { Statement } from "~/types";
import { chunkSentence, splitStatements } from "../splitMode";

const statement: Statement = {
  id: "s1",
  order: 1,
  chinese: "如果我们探测到了来自外星文明的信号，我们应该如何回应是一个备受争议的问题。",
  english:
    "There is considerable debate over how we should react if we detect a signal from an alien civilisation.",
  soundmark: "",
  isMastered: false,
};

describe("chunkSentence", () => {
  it("breaks at prepositions and conjunctions", () => {
    const chunks = chunkSentence(statement.english);
    expect(chunks.length).toBeGreaterThan(1);
    expect(chunks.join(" ")).toBe(statement.english);
    // 断开点应在介词/连词前：over / if / from 都会成为某个语块的开头
    expect(chunks.some((chunk) => /^(over|if|from)\b/i.test(chunk))).toBe(true);
  });

  it("keeps short sentences whole", () => {
    expect(chunkSentence("I like it")).toEqual(["I like it"]);
  });
});

describe("splitStatements", () => {
  it("returns only the full sentence for sentence_only", () => {
    const items = splitStatements([statement], "sentence_only");
    expect(items).toHaveLength(1);
    expect(items[0].english).toBe(statement.english);
    expect(items[0].isFragment).toBe(false);
  });

  it("ends with the full sentence for word_first", () => {
    const items = splitStatements([statement], "word_first");
    expect(items.length).toBeGreaterThan(5);
    const last = items[items.length - 1];
    expect(last.english).toBe(statement.english);
    expect(last.isFragment).toBe(false);
    expect(items[0].isFragment).toBe(true);
    expect(items[0].hint).toContain("前 2 个单词");
  });

  it("includes chunks and combos for chunk_first without phrase stage", () => {
    const items = splitStatements([statement], "chunk_first");
    const hints = items.map((item) => item.hint ?? "");
    expect(hints.some((hint) => hint.includes("个语块"))).toBe(true);
    expect(hints.some((hint) => hint.includes("个单词"))).toBe(false);
  });

  it("respects custom stages", () => {
    const onlyFull = splitStatements([statement], "custom", ["full_sentence"]);
    expect(onlyFull).toHaveLength(1);

    const phraseOnly = splitStatements([statement], "custom", ["phrase"]);
    expect(phraseOnly.every((item) => item.isFragment)).toBe(true);
  });

  it("deduplicates identical fragments", () => {
    const items = splitStatements([statement], "custom", ["phrase", "core_chunk", "full_sentence"]);
    const keys = items.map((item) => `${item.english.toLowerCase()}`);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it("gives every item a unique id", () => {
    const items = splitStatements([statement], "word_first");
    const ids = items.map((item) => item.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("片段只带自己的中文，不是整句译文", () => {
    const withGlossary: Statement = {
      ...statement,
      english: "Essentially, a theory is an abstract representation.",
      chinese: "本质上，理论是一种抽象的表达。",
      analysis: {
        segments: [],
        glossary: [
          { word: "essentially", meaning: "本质上" },
          { word: "theory", meaning: "理论" },
          { word: "abstract", meaning: "抽象的" },
        ],
      },
    };

    const items = splitStatements([withGlossary], "chunk_first", []);

    for (const fragment of items.filter((item) => item.isFragment)) {
      expect(fragment.chinese).not.toBe(withGlossary.chinese);
      expect(fragment.chinese ?? "").not.toContain("抽象的表达");
    }

    const first = items[0];
    expect(first.chinese).toContain("本质上");

    const last = items[items.length - 1];
    expect(last.isFragment).toBe(false);
    expect(last.chinese).toBe(withGlossary.chinese);
  });
});
