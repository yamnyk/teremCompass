import { describe, it, expect, beforeEach } from "vitest";
import { flashTemplate, boomTemplate, triggerBoom } from "./boom";
import { renderApp } from "../ui/app";
import { $ } from "../lib/dom";
import { cheers } from "./cheers";

beforeEach(() => {
  document.body.innerHTML = "";
  renderApp();
});

describe("templates", () => {
  it("flashTemplate is an empty #flash div", () => {
    expect(flashTemplate()).toBe('<div id="flash"></div>');
  });

  it("boomTemplate seeds the first cheer from the cheers list", () => {
    const wrap = document.createElement("div");
    wrap.innerHTML = boomTemplate();
    expect(wrap.querySelector("#boom > span")?.textContent).toBe(cheers[0]);
  });
});

describe("triggerBoom", () => {
  it("writes the given cheer into the boom span", () => {
    triggerBoom(cheers[2]!);
    expect($("boom").firstElementChild!.textContent).toBe(cheers[2]);
  });

  it('replays the boom and flash animations by adding "go" to both', () => {
    triggerBoom(cheers[1]!);
    expect($("boom").classList.contains("go")).toBe(true);
    expect($("flash").classList.contains("go")).toBe(true);
  });

  it('re-triggering keeps a single "go" class on each element', () => {
    triggerBoom(cheers[0]!);
    triggerBoom(cheers[3]!);
    expect(
      $("boom")
        .className.split(" ")
        .filter((c) => c === "go"),
    ).toHaveLength(1);
    expect(
      $("flash")
        .className.split(" ")
        .filter((c) => c === "go"),
    ).toHaveLength(1);
    expect($("boom").firstElementChild!.textContent).toBe(cheers[3]);
  });

  it("treats the cheer as text (no HTML injection)", () => {
    triggerBoom("<i>x</i>");
    expect($("boom").querySelector("i")).toBeNull();
  });
});
