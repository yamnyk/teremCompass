import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { celebrate } from "./index";
import { triggerBoom } from "./boom";
import { confetti } from "./confetti";
import { ding } from "./sound";
import { state } from "../state";
import { cheers } from "./cheers";

vi.mock("./boom", () => ({ triggerBoom: vi.fn() }));
vi.mock("./confetti", () => ({ confetti: vi.fn() }));
vi.mock("./sound", () => ({ ding: vi.fn() }));

const vibrate = vi.fn();

beforeEach(() => {
  state.lastBoom = 0;
  vi.useFakeTimers();
  vi.setSystemTime(10_000);
  vi.stubGlobal("navigator", { vibrate });
});

afterEach(() => {
  vi.useRealTimers();
});

describe("celebrate", () => {
  it("fires the boom, confetti, ding and vibration on the first call", () => {
    celebrate();
    expect(triggerBoom).toHaveBeenCalledTimes(1);
    expect(confetti).toHaveBeenCalledTimes(1);
    expect(ding).toHaveBeenCalledTimes(1);
    expect(vibrate).toHaveBeenCalledTimes(1);
  });

  it("never shows the same cheer twice in a row, and shows all of them each round", () => {
    const shown: string[] = [];
    for (let i = 0; i < cheers.length * 3; i++) {
      state.lastBoom = 0;
      celebrate();
      shown.push(vi.mocked(triggerBoom).mock.calls.at(-1)![0]);
    }
    for (let i = 1; i < shown.length; i++)
      expect(shown[i]).not.toBe(shown[i - 1]);
    // earlier tests may have left the bag mid-round, so 3 rounds' worth of draws
    // shows each cheer 2 to 4 times, never 0
    const counts = new Map<string, number>();
    for (const c of shown) counts.set(c, (counts.get(c) ?? 0) + 1);
    for (const c of cheers) {
      expect(counts.get(c)).toBeGreaterThanOrEqual(2);
      expect(counts.get(c)).toBeLessThanOrEqual(4);
    }
  });

  it("vibrates with the pattern [40, 30, 40, 30, 160]", () => {
    celebrate();
    expect(vibrate).toHaveBeenCalledWith([40, 30, 40, 30, 160]);
  });

  it("records the time of the boom in state.lastBoom", () => {
    celebrate();
    expect(state.lastBoom).toBe(10_000);
  });

  it("is throttled: a second call within 2500 ms does nothing", () => {
    celebrate();
    vi.advanceTimersByTime(2499);
    celebrate();
    expect(triggerBoom).toHaveBeenCalledTimes(1);
    expect(confetti).toHaveBeenCalledTimes(1);
    expect(ding).toHaveBeenCalledTimes(1);
    expect(vibrate).toHaveBeenCalledTimes(1);
    expect(state.lastBoom).toBe(10_000);
  });

  it("fires again at exactly 2500 ms (boundary is strict <)", () => {
    celebrate();
    vi.advanceTimersByTime(2500);
    celebrate();
    expect(triggerBoom).toHaveBeenCalledTimes(2);
    expect(state.lastBoom).toBe(12_500);
  });

  it("a throttled call does not reset the throttle window", () => {
    celebrate();
    vi.advanceTimersByTime(2000);
    celebrate(); // ignored
    vi.advanceTimersByTime(500); // 2500 since the first boom
    celebrate();
    expect(triggerBoom).toHaveBeenCalledTimes(2);
  });

  it("does not vibrate when navigator.vibrate is unavailable, but still celebrates", () => {
    vi.stubGlobal("navigator", {});
    expect(() => celebrate()).not.toThrow();
    expect(triggerBoom).toHaveBeenCalledTimes(1);
    expect(confetti).toHaveBeenCalledTimes(1);
    expect(ding).toHaveBeenCalledTimes(1);
  });
});
