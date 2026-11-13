import { usePronunciation } from "~/composables/user/pronunciation";

export interface PlayOptions {
  times?: number;
  rate?: number;
  interval?: number;
}

const DefaultPlayOptions: Required<PlayOptions> = {
  times: 1,
  rate: 1,
  interval: 500,
};

// 便于测试
// 后面不使用 audio 后也可以不破坏业务逻辑
const audio = new Audio();
let currentText = "";

export function updateSource(src: string, text: string = "") {
  audio.src = src;
  currentText = text;
  audio.load();
}

const { getPronunciationUrl } = usePronunciation();

function canUseSpeechSynthesis() {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

/**
 * 有道发音接口对部分整句会返回 500(returned null audio)，
 * 导致 <audio> 没有可播放的音源，这里回退到浏览器内置的语音合成。
 */
function speakWithBrowserTTS(text: string, options: Required<PlayOptions>) {
  if (!text || !canUseSpeechSynthesis()) {
    return () => {};
  }

  const { times, rate, interval } = options;
  const synth = window.speechSynthesis;

  let cancelled = false;
  let index = 0;
  let timeoutId: NodeJS.Timeout;

  synth.cancel();

  function speak() {
    if (cancelled) return;

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-US";
    utterance.rate = rate;
    utterance.onend = () => {
      index++;
      if (cancelled || index >= times) return;
      timeoutId = setTimeout(speak, interval);
    };
    synth.speak(utterance);
  }

  speak();

  return () => {
    cancelled = true;
    timeoutId && clearTimeout(timeoutId);
    synth.cancel();
  };
}

export function usePlayWordSound() {
  const wordAudio = new Audio();
  let lastWord = "";
  let isPlaying = false;

  wordAudio.onplay = () => {
    isPlaying = true;
  };

  wordAudio.onended = () => {
    isPlaying = false;
  };

  function handlePlayWordSound(word: string) {
    if (!word) return;

    if (isPlaying && lastWord === word) {
      // skip
      return;
    }
    lastWord = word;
    wordAudio.src = getPronunciationUrl(word);
    wordAudio.play().catch((error: DOMException) => {
      if (error?.name !== "NotSupportedError") return;
      speakWithBrowserTTS(word, DefaultPlayOptions);
    });
  }

  return {
    handlePlayWordSound,
  };
}

export function play(playOptions?: PlayOptions) {
  const options: Required<PlayOptions> = { ...DefaultPlayOptions, ...playOptions };
  const { times, rate, interval } = options;

  // 课程/句子还没加载时不要用空文本去请求发音
  if (!audio.src || !currentText) {
    return () => {};
  }

  let cancelled = false;
  let cancelFallback: (() => void) | undefined;
  let timeoutId: NodeJS.Timeout | undefined;

  audio.playbackRate = rate;

  const playPromise = audio.play();
  playPromise?.catch((error: DOMException) => {
    if (cancelled || error?.name !== "NotSupportedError") return;

    // 音源不可用（如有道接口返回 500），回退到浏览器语音合成
    cancelFallback = speakWithBrowserTTS(currentText, options);
  });

  if (times > 1) {
    audio.addEventListener("ended", handleEnded, false);
  }

  let index = 1;
  function handleEnded() {
    timeoutId = setTimeout(() => {
      if (index < times) {
        audio.play().catch(() => {});
        index++;
      } else {
        index = 1;
        audio.removeEventListener("ended", handleEnded);
      }
    }, interval);
  }

  return () => {
    cancelled = true;
    audio.pause();
    audio.currentTime = 0;
    audio.removeEventListener("ended", handleEnded);
    timeoutId && clearTimeout(timeoutId);
    cancelFallback?.();
  };
}
