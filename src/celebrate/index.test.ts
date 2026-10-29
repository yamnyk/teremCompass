import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { celebrate } from "./index";
import { triggerBoom } from "./boom";
import { confetti } from "./confetti";
import { ding } from "./sound";
import { state } from "../state";
import { t } from "../i18n";

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

  it("passes a random cheer from t.cheers to triggerBoom (index from Math.random)", () => {
    vi.spyOn(Math, "random").mockReturnValue(0);
    celebrate();
    expect(triggerBoom).toHaveBeenCalledWith(t.cheers[0]);
  });

  it("picks the last cheer when Math.random is close to 1", () => {
    vi.spyOn(Math, "random").mockReturnValue(0.9999);
    celebrate();
    expect(triggerBoom).toHaveBeenCalledWith(t.cheers[3]);
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
