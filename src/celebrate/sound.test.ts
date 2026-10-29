import { describe, it, expect, beforeEach, vi } from "vitest";

const FREQS = [523.25, 659.25, 783.99, 1046.5];

interface Osc {
  type: string;
  frequency: { value: number };
  connect: ReturnType<typeof vi.fn>;
  start: ReturnType<typeof vi.fn>;
  stop: ReturnType<typeof vi.fn>;
}
interface Gain {
  gain: {
    setValueAtTime: ReturnType<typeof vi.fn>;
    linearRampToValueAtTime: ReturnType<typeof vi.fn>;
    exponentialRampToValueAtTime: ReturnType<typeof vi.fn>;
  };
  connect: ReturnType<typeof vi.fn>;
}

let oscs: Osc[];
let gains: Gain[];
let ctorCount = 0;
let resume: ReturnType<typeof vi.fn>;

function makeFakeContext(
  opts: { throwOnCtor?: boolean; resumeThrows?: boolean } = {},
) {
  resume = vi.fn(() => {
    if (opts.resumeThrows) throw new Error("resume failed");
    return Promise.resolve();
  });
  return class FakeAudioContext {
    currentTime = 5;
    destination = { id: "dest" };
    resume = resume;
    constructor() {
      ctorCount++;
      if (opts.throwOnCtor) throw new Error("no audio");
    }
    createOscillator(): Osc {
      // ding() does o.connect(g).connect(destination): connect returns the gain just created.
      const o: Osc = {
        type: "",
        frequency: { value: 0 },
        connect: vi.fn(() => gains[gains.length - 1]),
        start: vi.fn(),
        stop: vi.fn(),
      };
      oscs.push(o);
      return o;
    }
    createGain(): Gain {
      const g: Gain = {
        gain: {
          setValueAtTime: vi.fn(),
          linearRampToValueAtTime: vi.fn(),
          exponentialRampToValueAtTime: vi.fn(),
        },
        connect: vi.fn(),
      };
      gains.push(g);
      return g;
    }
  };
}

beforeEach(() => {
  vi.resetModules();
  oscs = [];
  gains = [];
  ctorCount = 0;
});

describe("ding", () => {
  it("creates one AudioContext via window.AudioContext and plays 4 triangle notes", async () => {
    const Ctx = makeFakeContext();
    vi.stubGlobal("AudioContext", Ctx);
    const { ding } = await import("./sound");
    ding();
    expect(ctorCount).toBe(1);
    expect(oscs).toHaveLength(4);
    expect(gains).toHaveLength(4);
    oscs.forEach((o) => expect(o.type).toBe("triangle"));
  });

  it("plays the C5 E5 G5 C6 ascent at the spec frequencies", async () => {
    vi.stubGlobal("AudioContext", makeFakeContext());
    const { ding } = await import("./sound");
    ding();
    expect(oscs.map((o) => o.frequency.value)).toEqual(FREQS);
  });

  it("staggers each note by 90 ms starting at currentTime", async () => {
    vi.stubGlobal("AudioContext", makeFakeContext());
    const { ding } = await import("./sound");
    ding();
    oscs.forEach((o, i) => {
      expect(o.start).toHaveBeenCalledWith(5 + i * 0.09);
      expect(o.stop).toHaveBeenCalledWith(5 + i * 0.09 + 0.55);
    });
  });

  it("envelope: ramps to 0.18 in 20 ms and decays to 0.001 over 500 ms", async () => {
    vi.stubGlobal("AudioContext", makeFakeContext());
    const { ding } = await import("./sound");
    ding();
    gains.forEach((g, i) => {
      const at = 5 + i * 0.09;
      expect(g.gain.setValueAtTime).toHaveBeenCalledWith(0, at);
      expect(g.gain.linearRampToValueAtTime).toHaveBeenCalledWith(
        0.18,
        at + 0.02,
      );
      expect(g.gain.exponentialRampToValueAtTime).toHaveBeenCalledWith(
        0.001,
        at + 0.5,
      );
    });
  });

  it("wires oscillator -> gain -> destination", async () => {
    vi.stubGlobal("AudioContext", makeFakeContext());
    const { ding } = await import("./sound");
    ding();
    oscs.forEach((o) => expect(o.connect).toHaveBeenCalledTimes(1));
    gains.forEach((g) =>
      expect(g.connect).toHaveBeenCalledWith({ id: "dest" }),
    );
  });

  it("reuses the same AudioContext across calls", async () => {
    vi.stubGlobal("AudioContext", makeFakeContext());
    const { ding } = await import("./sound");
    ding();
    ding();
    expect(ctorCount).toBe(1);
    expect(oscs).toHaveLength(8);
  });

  it("swallows errors when the context cannot be created", async () => {
    vi.stubGlobal("AudioContext", makeFakeContext({ throwOnCtor: true }));
    const { ding } = await import("./sound");
    expect(() => ding()).not.toThrow();
    expect(oscs).toHaveLength(0);
  });

  it("falls back to webkitAudioContext when AudioContext is absent", async () => {
    vi.stubGlobal("AudioContext", undefined);
    vi.stubGlobal("webkitAudioContext", makeFakeContext());
    const { ding } = await import("./sound");
    ding();
    expect(ctorCount).toBe(1);
    expect(oscs).toHaveLength(4);
  });
});

describe("unlockAudio", () => {
  it("creates the context and calls resume()", async () => {
    vi.stubGlobal("AudioContext", makeFakeContext());
    const { unlockAudio } = await import("./sound");
    unlockAudio();
    expect(ctorCount).toBe(1);
    expect(resume).toHaveBeenCalledTimes(1);
  });

  it("reuses an existing context created by ding()", async () => {
    vi.stubGlobal("AudioContext", makeFakeContext());
    const { ding, unlockAudio } = await import("./sound");
    ding();
    unlockAudio();
    expect(ctorCount).toBe(1);
    expect(resume).toHaveBeenCalledTimes(1);
  });

  it("falls back to webkitAudioContext when AudioContext is absent", async () => {
    vi.stubGlobal("AudioContext", undefined);
    vi.stubGlobal("webkitAudioContext", makeFakeContext());
    const { unlockAudio } = await import("./sound");
    unlockAudio();
    expect(ctorCount).toBe(1);
    expect(resume).toHaveBeenCalledTimes(1);
  });

  it("swallows errors from resume()", async () => {
    vi.stubGlobal("AudioContext", makeFakeContext({ resumeThrows: true }));
    const { unlockAudio } = await import("./sound");
    expect(() => unlockAudio()).not.toThrow();
  });

  it("swallows errors when the context cannot be created", async () => {
    vi.stubGlobal("AudioContext", makeFakeContext({ throwOnCtor: true }));
    const { unlockAudio } = await import("./sound");
    expect(() => unlockAudio()).not.toThrow();
    expect(resume).not.toHaveBeenCalled();
  });
});
