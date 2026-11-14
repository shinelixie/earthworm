import { computed, ref } from "vue";

const STORAGE_KEY = "audioVolume";
const MUTE_KEY = "audioMuted";

const volume = ref(80);
const muted = ref(false);

loadCache();

function loadCache() {
  if (typeof localStorage === "undefined") return;

  const cachedVolume = Number(localStorage.getItem(STORAGE_KEY));
  if (!Number.isNaN(cachedVolume) && cachedVolume >= 0 && cachedVolume <= 100) {
    volume.value = cachedVolume;
  }
  muted.value = localStorage.getItem(MUTE_KEY) === "1";
}

function persist() {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(STORAGE_KEY, String(volume.value));
  localStorage.setItem(MUTE_KEY, muted.value ? "1" : "0");
}

/** 供音频模块读取的最终音量（0~1），静音时为 0 */
export function getEffectiveVolume() {
  return muted.value ? 0 : volume.value / 100;
}

export function useVolume() {
  function setVolume(next: number) {
    const clamped = Math.min(100, Math.max(0, Math.round(next)));
    volume.value = clamped;
    if (clamped > 0 && muted.value) {
      muted.value = false;
    }
    persist();
  }

  function toggleMute() {
    muted.value = !muted.value;
    persist();
  }

  function mute() {
    muted.value = true;
    persist();
  }

  function unmute() {
    muted.value = false;
    persist();
  }

  const effectiveVolume = computed(() => getEffectiveVolume());

  const icon = computed(() => {
    if (muted.value || volume.value === 0) return "i-ph-speaker-slash";
    if (volume.value < 50) return "i-ph-speaker-low";
    return "i-ph-speaker-high";
  });

  return {
    volume,
    muted,
    effectiveVolume,
    icon,
    setVolume,
    toggleMute,
    mute,
    unmute,
  };
}
