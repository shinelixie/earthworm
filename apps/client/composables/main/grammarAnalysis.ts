import { computed, ref } from "vue";

import type { StatementAnalysis } from "~/types/models/statement-analysis";

const STORAGE_KEY = "grammarAnalysisVisible";
const visible = ref(true);

loadCache();

function loadCache() {
  const cached = localStorage.getItem(STORAGE_KEY);
  if (cached !== null) {
    visible.value = cached === "1";
  }
}

export function useGrammarAnalysis() {
  function toggle() {
    visible.value = !visible.value;
    localStorage.setItem(STORAGE_KEY, visible.value ? "1" : "0");
  }

  function show() {
    visible.value = true;
    localStorage.setItem(STORAGE_KEY, "1");
  }

  function hide() {
    visible.value = false;
    localStorage.setItem(STORAGE_KEY, "0");
  }

  const isVisible = computed(() => visible.value);

  return {
    isVisible,
    toggle,
    show,
    hide,
  };
}
