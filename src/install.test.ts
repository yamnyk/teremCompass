import { describe, expect, it, vi } from "vitest";

const openSheet = vi.fn();
vi.mock("./ui/sheet", () => ({ openSheet: () => openSheet() }));

interface Opts {
  standalone?: boolean;
  ua?: string;
  platform?: string;
  touch?: number;
}

async function load(o: Opts = {}) {
  vi.resetModules();
  openSheet.mockClear();
  vi.stubGlobal("matchMedia", (q: string) => ({
    matches: q.includes("standalone") ? !!o.standalone : false,
  }));
  vi.stubGlobal("navigator", {
    userAgent: o.ua ?? "Desktop",
    platform: o.platform ?? "Linux",
    maxTouchPoints: o.touch ?? 0,
  });
  document.body.innerHTML = '<button id="install" hidden></button>';
  const { initInstall } = await import("./install");
  const { state } = await import("./state");
  initInstall();
  return {
    state,
    btn: document.getElementById("install") as HTMLButtonElement,
  };
}

const IOS = "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)";
const ANDROID = "Mozilla/5.0 (Linux; Android 14)";

function bip(
  prompt = vi.fn().mockResolvedValue(undefined),
  userChoice: Promise<unknown> = Promise.resolve({}),
) {
  const e = new Event("beforeinstallprompt", { cancelable: true });
  Object.assign(e, { prompt, userChoice });
  window.dispatchEvent(e);
  return { e, prompt };
}

describe("initial visibility", () => {
  it("hidden on desktop", async () => {
    expect((await load()).btn.hidden).toBe(true);
  });
  it("shown on iOS", async () => {
    expect((await load({ ua: IOS })).btn.hidden).toBe(false);
  });
  it("shown on iPadOS (MacIntel with touch)", async () => {
    expect((await load({ platform: "MacIntel", touch: 5 })).btn.hidden).toBe(
      false,
    );
  });
  it("shown on Android", async () => {
    expect((await load({ ua: ANDROID })).btn.hidden).toBe(false);
  });
  it("hidden when standalone on iOS", async () => {
    expect((await load({ ua: IOS, standalone: true })).btn.hidden).toBe(true);
  });
  it("hidden when navigator.standalone is true", async () => {
    vi.resetModules();
    vi.stubGlobal("matchMedia", () => ({ matches: false }));
    vi.stubGlobal("navigator", {
      userAgent: IOS,
      platform: "",
      maxTouchPoints: 0,
      standalone: true,
    });
    document.body.innerHTML = '<button id="install" hidden></button>';
    const { initInstall } = await import("./install");
    initInstall();
    expect(document.getElementById("install")!.hidden).toBe(true);
  });
});

describe("events", () => {
  it("beforeinstallprompt prevents default, stores event, shows button", async () => {
    const { state, btn } = await load();
    const { e } = bip();
    expect(e.defaultPrevented).toBe(true);
    expect(state.deferred).toBe(e);
    expect(btn.hidden).toBe(false);
  });

  it("beforeinstallprompt keeps button hidden when standalone", async () => {
    const { state, btn } = await load({ standalone: true });
    bip();
    expect(state.deferred).not.toBeNull();
    expect(btn.hidden).toBe(true);
  });

  it("appinstalled clears deferred and hides button", async () => {
    const { state, btn } = await load();
    bip();
    window.dispatchEvent(new Event("appinstalled"));
    expect(state.deferred).toBeNull();
    expect(btn.hidden).toBe(true);
  });
});

describe("click", () => {
  it("with deferred prompt: prompts, awaits choice, clears and hides", async () => {
    const { state, btn } = await load();
    const { prompt } = bip();
    btn.click();
    await vi.waitFor(() => expect(state.deferred).toBeNull());
    expect(prompt).toHaveBeenCalledOnce();
    expect(btn.hidden).toBe(true);
    expect(openSheet).not.toHaveBeenCalled();
  });

  it("swallows userChoice rejection", async () => {
    const { state, btn } = await load();
    bip(undefined, Promise.reject(new Error("x")));
    btn.click();
    await vi.waitFor(() => expect(state.deferred).toBeNull());
    expect(btn.hidden).toBe(true);
  });

  it("without deferred prompt opens the sheet", async () => {
    const { btn } = await load({ ua: IOS });
    btn.click();
    expect(openSheet).toHaveBeenCalledOnce();
    expect(btn.hidden).toBe(false);
  });
});
