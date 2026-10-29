import { describe, it, expect, beforeEach, vi } from "vitest";
import { $, replay } from "./dom";

beforeEach(() => {
  document.body.innerHTML = "";
});

describe("$", () => {
  it("returns the element with the given id", () => {
    document.body.innerHTML = '<div id="target"><span>x</span></div>';
    const el = $("target");
    expect(el).toBe(document.getElementById("target"));
    expect(el.tagName).toBe("DIV");
  });

  it("returns null at runtime when the id is missing (typed as non-null)", () => {
    expect($("nope")).toBeNull();
  });
});

describe("replay", () => {
  it('adds the "go" class to an element that did not have it', () => {
    document.body.innerHTML = '<div id="x"></div>';
    const el = $("x");
    replay(el);
    expect(el.classList.contains("go")).toBe(true);
  });

  it('leaves exactly one "go" class when it was already present', () => {
    document.body.innerHTML = '<div id="x" class="go other"></div>';
    const el = $("x");
    replay(el);
    expect(el.classList.contains("go")).toBe(true);
    expect(el.className.split(" ").filter((c) => c === "go")).toHaveLength(1);
    expect(el.classList.contains("other")).toBe(true);
  });

  it('removes "go" then re-adds it, reading offsetWidth in between (forced reflow)', () => {
    document.body.innerHTML = '<div id="x" class="go"></div>';
    const el = $("x");
    const order: string[] = [];
    const cl = el.classList;
    const removeSpy = vi.spyOn(cl, "remove");
    const addSpy = vi.spyOn(cl, "add");
    vi.spyOn(el, "offsetWidth", "get").mockImplementation(() => {
      order.push("reflow");
      return 0;
    });
    removeSpy.mockImplementation((...a: string[]) => {
      order.push("remove:" + a.join(","));
      return undefined;
    });
    addSpy.mockImplementation((...a: string[]) => {
      order.push("add:" + a.join(","));
      return undefined;
    });
    replay(el);
    expect(order).toEqual(["remove:go", "reflow", "add:go"]);
  });
});
