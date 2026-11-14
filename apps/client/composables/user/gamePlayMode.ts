import { ref } from "vue";

export enum GamePlayMode {
  Dictation = "DICTATION",
  ChineseToEnglish = "CHINESE_TO_ENGLISH",
  Listening = "LISTENING",
}

export const gamePlayModeLabels: { [key in GamePlayMode]: string } = {
  [GamePlayMode.ChineseToEnglish]: "中译英",
  [GamePlayMode.Dictation]: "听写",
  [GamePlayMode.Listening]: "听力",
};

const GamePlayModeKey = "gamePlayMode";
const currentGamePlayMode = ref<GamePlayMode>(GamePlayMode.ChineseToEnglish);

function loadCache() {
  const mode = getStore() || currentGamePlayMode.value;
  currentGamePlayMode.value = mode;
}

function getStore() {
  return localStorage.getItem(GamePlayModeKey) as GamePlayMode;
}

function setStore(value: GamePlayMode) {
  localStorage.setItem(GamePlayModeKey, value);
}

loadCache();

export function useGamePlayMode() {
  function getGamePlayModeOptions() {
    return Object.entries(gamePlayModeLabels).map(([key, value]) => {
      return {
        label: value,
        value: key,
      };
    });
  }

  function toggleGamePlayMode(mode: GamePlayMode) {
    currentGamePlayMode.value = mode;
    setStore(mode);
  }

  function isDictationMode() {
    return currentGamePlayMode.value === GamePlayMode.Dictation;
  }

  function isChineseToEnglishMode() {
    return currentGamePlayMode.value === GamePlayMode.ChineseToEnglish;
  }

  function isListeningMode() {
    return currentGamePlayMode.value === GamePlayMode.Listening;
  }

  /** 先出声后作答的模式（听写 / 听力），播放参数走听写工具栏 */
  function isAudioFirstMode() {
    return isDictationMode() || isListeningMode();
  }

  return {
    toggleGamePlayMode,
    getGamePlayModeOptions,
    currentGamePlayMode,
    isDictationMode,
    isChineseToEnglishMode,
    isListeningMode,
    isAudioFirstMode,
  };
}

/** 服务端模式名 -> 本地 GamePlayMode */
export function toGamePlayMode(mode: string): GamePlayMode {
  switch (mode) {
    case "dictation":
      return GamePlayMode.Dictation;
    case "listening":
      return GamePlayMode.Listening;
    default:
      return GamePlayMode.ChineseToEnglish;
  }
}

/** 本地 GamePlayMode -> 服务端模式名 */
export function toPracticeMode(mode: GamePlayMode): string {
  switch (mode) {
    case GamePlayMode.Dictation:
      return "dictation";
    case GamePlayMode.Listening:
      return "listening";
    default:
      return "chinese_to_english";
  }
}
