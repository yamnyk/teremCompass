import { describe, expect, it, vi } from "vitest";
import { registerSW } from "./sw-register";

describe("registerSW", () => {
  it("registers sw.js with updateViaCache none", () => {
    const register = vi.fn().mockResolvedValue({});
    vi.stubGlobal("navigator", { serviceWorker: { register } });
    registerSW();
    expect(register).toHaveBeenCalledWith("sw.js", { updateViaCache: "none" });
  });

  it("swallows registration rejection", async () => {
    const p = Promise.reject(new Error("nope"));
    const register = vi.fn().mockReturnValue(p);
    vi.stubGlobal("navigator", { serviceWorker: { register } });
    expect(() => registerSW()).not.toThrow();
    await new Promise((r) => setTimeout(r, 0));
  });

  it("is a no-op without serviceWorker support", () => {
    vi.stubGlobal("navigator", {});
    expect(() => registerSW()).not.toThrow();
  });
});
