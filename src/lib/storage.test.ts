import { beforeEach, describe, expect, it, vi } from "vitest";
import { get, remove, set } from "./storage";

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
});

describe("storage", () => {
  it("round-trips in local storage by default", () => {
    set("k", "v");
    expect(get("k")).toBe("v");
    expect(localStorage.getItem("k")).toBe("v");
    remove("k");
    expect(get("k")).toBeNull();
  });

  it("uses session storage when asked", () => {
    set("k", "v", "session");
    expect(sessionStorage.getItem("k")).toBe("v");
    expect(localStorage.getItem("k")).toBeNull();
    expect(get("k", "session")).toBe("v");
    remove("k", "session");
    expect(get("k", "session")).toBeNull();
  });

  it("never throws when storage is blocked", () => {
    const boom = () => {
      throw new Error("blocked");
    };
    vi.stubGlobal("localStorage", {
      getItem: boom,
      setItem: boom,
      removeItem: boom,
    });
    expect(get("k")).toBeNull();
    expect(() => set("k", "v")).not.toThrow();
    expect(() => remove("k")).not.toThrow();
  });
});
