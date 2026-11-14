import { computed, ref } from "vue";

import { Theme, useDarkMode } from "~/composables/darkMode";

const STORAGE_KEY = "backgroundTint";

export interface BackgroundTint {
  key: string;
  label: string;
  light: string;
  dark: string;
}

export const BACKGROUND_TINTS: BackgroundTint[] = [
  { key: "default", label: "默认", light: "#ffffff", dark: "#232323" },
  { key: "sepia", label: "米黄", light: "#f6f0e1", dark: "#2a251c" },
  { key: "green", label: "护眼绿", light: "#e7f0e4", dark: "#1e2a20" },
  { key: "blue", label: "淡蓝", light: "#e8f1f8", dark: "#1b242e" },
  { key: "rose", label: "浅粉", light: "#f9edee", dark: "#2b1f21" },
];

const currentTintKey = ref("default");

loadCache();

function loadCache() {
  const cached = localStorage.getItem(STORAGE_KEY);
  if (cached && BACKGROUND_TINTS.some((tint) => tint.key === cached)) {
    currentTintKey.value = cached;
  }
}

export function useBackgroundTint() {
  const { darkMode } = useDarkMode();

  function setTint(key: string) {
    if (!BACKGROUND_TINTS.some((tint) => tint.key === key)) return;
    currentTintKey.value = key;
    localStorage.setItem(STORAGE_KEY, key);
  }

  const currentTint = computed(
    () => BACKGROUND_TINTS.find((tint) => tint.key === currentTintKey.value) ?? BACKGROUND_TINTS[0],
  );

  /** 默认色调不注入内联样式，交回给 tailwind 的 bg-white / dark:bg-theme-dark */
  const tintStyle = computed(() => {
    if (currentTint.value.key === "default") return {};
    const color = darkMode.value === Theme.DARK ? currentTint.value.dark : currentTint.value.light;
    return { backgroundColor: color };
  });

  return {
    tints: BACKGROUND_TINTS,
    currentTint,
    currentTintKey,
    tintStyle,
    setTint,
  };
}
