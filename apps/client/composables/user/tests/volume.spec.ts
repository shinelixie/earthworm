import { beforeEach, describe, expect, it } from "vitest";

import { getEffectiveVolume, useVolume } from "../volume";

describe("volume", () => {
  beforeEach(() => {
    localStorage.clear();
    const { setVolume, unmute } = useVolume();
    unmute();
    setVolume(80);
  });

  it("把 0-100 的百分比换算成 0-1 的音量", () => {
    const { setVolume } = useVolume();
    setVolume(50);
    expect(getEffectiveVolume()).toBeCloseTo(0.5);
  });

  it("超出范围会被夹紧", () => {
    const { setVolume, volume } = useVolume();
    setVolume(-20);
    expect(volume.value).toBe(0);
    setVolume(400);
    expect(volume.value).toBe(100);
  });

  it("静音后有效音量为 0，取消静音恢复", () => {
    const { setVolume, mute, unmute } = useVolume();
    setVolume(70);
    mute();
    expect(getEffectiveVolume()).toBe(0);
    unmute();
    expect(getEffectiveVolume()).toBeCloseTo(0.7);
  });

  it("调音量会自动解除静音", () => {
    const { setVolume, mute, muted } = useVolume();
    mute();
    setVolume(30);
    expect(muted.value).toBe(false);
    expect(getEffectiveVolume()).toBeCloseTo(0.3);
  });

  it("写入 localStorage 以便下次启动恢复", () => {
    const { setVolume, mute } = useVolume();
    setVolume(45);
    expect(localStorage.getItem("audioVolume")).toBe("45");
    mute();
    expect(localStorage.getItem("audioMuted")).toBe("1");
  });

  it("音量图标随状态变化", () => {
    const { setVolume, mute, icon } = useVolume();
    setVolume(80);
    expect(icon.value).toBe("i-ph-speaker-high");
    setVolume(20);
    expect(icon.value).toBe("i-ph-speaker-low");
    mute();
    expect(icon.value).toBe("i-ph-speaker-slash");
  });
});
