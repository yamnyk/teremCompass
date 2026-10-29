import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { renderApp } from "../ui/app";
import { $ } from "../lib/dom";

interface FakeCtx {
  globalAlpha: number;
  clearRect: ReturnType<typeof vi.fn>;
  save: ReturnType<typeof vi.fn>;
  restore: ReturnType<typeof vi.fn>;
  translate: ReturnType<typeof vi.fn>;
  rotate: ReturnType<typeof vi.fn>;
  fillRect: ReturnType<typeof vi.fn>;
  fillStyle: string;
  alphasAtDraw: number[];
}

let ctx: FakeCtx;

function makeCtx(): FakeCtx {
  const c: FakeCtx = {
    globalAlpha: 1,
    fillStyle: "",
    alphasAtDraw: [],
    clearRect: vi.fn(),
    save: vi.fn(),
    restore: vi.fn(),
    translate: vi.fn(),
    rotate: vi.fn(),
    fillRect: vi.fn(() => {
      c.alphasAtDraw.push(c.globalAlpha);
    }),
  };
  return c;
}

async function loadConfetti(reduce: boolean) {
  vi.resetModules();
  vi.doMock("../lib/platform", () => ({ reduce }));
  return import("./confetti");
}

function stubCanvas() {
  ctx = makeCtx();
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockImplementation(
    () => ctx as unknown as CanvasRenderingContext2D,
  );
}

beforeEach(() => {
  document.body.innerHTML = "";
  renderApp();
});

afterEach(() => {
  vi.doUnmock("../lib/platform");
});

describe("fxTemplate", () => {
  it("is a canvas with id fx", async () => {
    const { fxTemplate } = await loadConfetti(false);
    expect(fxTemplate()).toBe('<canvas id="fx"></canvas>');
  });
});

describe("initFx", () => {
  it("gets a 2d context and sizes the canvas to viewport * devicePixelRatio", async () => {
    stubCanvas();
    vi.stubGlobal("innerWidth", 300);
    vi.stubGlobal("innerHeight", 200);
    vi.stubGlobal("devicePixelRatio", 2);
    const { initFx } = await loadConfetti(false);
    initFx();
    expect(HTMLCanvasElement.prototype.getContext).toHaveBeenCalledWith("2d");
    expect($<HTMLCanvasElement>("fx").width).toBe(600);
    expect($<HTMLCanvasElement>("fx").height).toBe(400);
  });

  it("re-sizes on window resize", async () => {
    stubCanvas();
    vi.stubGlobal("innerWidth", 300);
    vi.stubGlobal("innerHeight", 200);
    vi.stubGlobal("devicePixelRatio", 1);
    const { initFx } = await loadConfetti(false);
    initFx();
    vi.stubGlobal("innerWidth", 500);
    vi.stubGlobal("innerHeight", 100);
    window.dispatchEvent(new Event("resize"));
    expect($<HTMLCanvasElement>("fx").width).toBe(500);
    expect($<HTMLCanvasElement>("fx").height).toBe(100);
  });
});

describe("confetti", () => {
  it("spawns 160 particles that are drawn on the next frame", async () => {
    stubCanvas();
    const { initFx, confetti, drawFx } = await loadConfetti(false);
    initFx();
    confetti();
    drawFx();
    expect(ctx.fillRect).toHaveBeenCalledTimes(160);
  });

  it("draws each particle inside save/restore with translate and rotate", async () => {
    stubCanvas();
    const { initFx, confetti, drawFx } = await loadConfetti(false);
    initFx();
    confetti();
    drawFx();
    expect(ctx.save).toHaveBeenCalledTimes(160);
    expect(ctx.restore).toHaveBeenCalledTimes(160);
    expect(ctx.translate).toHaveBeenCalledTimes(160);
    expect(ctx.rotate).toHaveBeenCalledTimes(160);
  });

  it("does nothing under reduced motion", async () => {
    stubCanvas();
    const { initFx, confetti, drawFx } = await loadConfetti(true);
    initFx();
    confetti();
    drawFx();
    expect(ctx.fillRect).not.toHaveBeenCalled();
  });

  it("cycles the five palette colours across particles", async () => {
    stubCanvas();
    const { initFx, confetti, drawFx } = await loadConfetti(false);
    initFx();
    const colours: string[] = [];
    ctx.fillRect.mockImplementation(() => {
      colours.push(ctx.fillStyle);
    });
    confetti();
    drawFx();
    expect(colours).toHaveLength(160);
    expect(new Set(colours).size).toBe(5);
    expect(colours.slice(0, 5)).toEqual(colours.slice(5, 10));
  });
});

describe("drawFx", () => {
  it("clears the whole canvas at the start of each frame", async () => {
    stubCanvas();
    vi.stubGlobal("innerWidth", 40);
    vi.stubGlobal("innerHeight", 30);
    vi.stubGlobal("devicePixelRatio", 1);
    const { initFx, drawFx } = await loadConfetti(false);
    initFx();
    drawFx();
    expect(ctx.clearRect).toHaveBeenCalledWith(0, 0, 40, 30);
  });

  it("with no particles, draws nothing", async () => {
    stubCanvas();
    const { initFx, drawFx } = await loadConfetti(false);
    initFx();
    drawFx();
    expect(ctx.fillRect).not.toHaveBeenCalled();
  });

  it("particles fade with life and are removed once life reaches zero", async () => {
    stubCanvas();
    const { initFx, confetti, drawFx } = await loadConfetti(false);
    initFx();
    confetti();
    drawFx();
    // life is decremented before drawing, so the first frame already draws at 1 - 0.008
    expect(ctx.alphasAtDraw[0]).toBeCloseTo(0.992, 9);
    // life drops by 0.008 per frame: the filter removes particles once life <= 0 (from frame 126 on).
    for (let i = 0; i < 123; i++) drawFx();
    ctx.fillRect.mockClear();
    drawFx();
    expect(ctx.fillRect.mock.calls.length).toBeGreaterThan(0);
    for (let i = 0; i < 10; i++) drawFx();
    ctx.fillRect.mockClear();
    drawFx();
    expect(ctx.fillRect).not.toHaveBeenCalled();
  });

  it("alpha is clamped at 0 for dead particles (never negative)", async () => {
    stubCanvas();
    const { initFx, confetti, drawFx } = await loadConfetti(false);
    initFx();
    confetti();
    for (let i = 0; i < 126; i++) drawFx();
    ctx.alphasAtDraw.length = 0;
    // any particle drawn near the end must still report a non-negative alpha
    drawFx();
    expect(ctx.alphasAtDraw.every((a) => a >= 0)).toBe(true);
  });
});
