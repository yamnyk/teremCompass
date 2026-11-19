import { beforeEach, describe, expect, it, vi } from "vitest";
import { t } from "../i18n";
import { $ } from "../lib/dom";
import { latestId } from "../whatsnew/registry";
import { renderApp } from "./app";

async function load() {
  vi.resetModules();
  localStorage.clear();
  document.body.innerHTML = "";
  renderApp();
  return import("./tour");
}

const entries = [
  { title: "one", text: "t1", preview: "eye" },
  { title: "two", text: "t2", preview: "route" },
  { title: "three", text: "t3" },
];
const title = () => $("tourT").textContent;

beforeEach(() => {
  localStorage.clear();
});

describe("tour", () => {
  it("auto-starts for a new user and walks Next to Done, marking seen", async () => {
    const m = await load();
    m.initTour();
    expect($("tour").hidden).toBe(false);
    const total = t.whatsNew.releases.flatMap((r) => r.entries).length;
    expect($("tourDots").children).toHaveLength(total);
    expect($("tourSkip").hidden).toBe(total === 1);
    for (let i = 0; i < total - 1; i++) $("tourNext").click();
    expect($("tourNext").textContent).toBe(t.whatsNew.done);
    expect($("tourSkip").hidden).toBe(true);
    expect(localStorage.getItem(m.SEEN_KEY)).toBeNull();
    $("tourNext").click();
    expect($("tour").hidden).toBe(true);
    expect(localStorage.getItem(m.SEEN_KEY)).toBe(latestId());
  });

  it("does not start when the latest release was already seen", async () => {
    const m = await load();
    localStorage.setItem(m.SEEN_KEY, latestId());
    m.initTour();
    expect($("tour").hidden).toBe(true);
  });

  it("Skip closes and still marks seen", async () => {
    const m = await load();
    m.initTour();
    m.startTour(entries, { seen: true });
    $("tourNext").click();
    $("tourSkip").click();
    expect($("tour").hidden).toBe(true);
    expect(localStorage.getItem(m.SEEN_KEY)).toBe(latestId());
  });

  it("renders title, text, preview, dots and button labels per step", async () => {
    const m = await load();
    m.initTour();
    m.startTour(entries, { seen: false });
    expect(title()).toBe("one");
    expect($("tourText").textContent).toBe("t1");
    expect($("tourPreview").innerHTML).toContain("👁");
    expect($("tourNext").textContent).toBe(t.whatsNew.next);
    expect($("tourDots").children[0]!.className).toBe("on");
    $("tourNext").click();
    expect(title()).toBe("two");
    expect($("tourPreview").innerHTML).toContain(t.buttons.route);
    expect($("tourDots").children[1]!.className).toBe("on");
    $("tourNext").click();
    expect(title()).toBe("three");
    expect($("tourPreview").innerHTML).toBe("");
    expect($("tourNext").textContent).toBe(t.whatsNew.done);
  });

  it("a replay leaves the seen marker untouched", async () => {
    const m = await load();
    m.initTour();
    $("tourSkip").click();
    localStorage.clear();
    $("help").click();
    expect($("tour").hidden).toBe(false);
    expect(title()).toBe(t.whatsNew.releases[0]!.entries[0]!.title);
    $("tourSkip").click();
    expect($("tour").hidden).toBe(true);
    expect(localStorage.getItem(m.SEEN_KEY)).toBeNull();
  });

  it("startTour ignores an empty list", async () => {
    const m = await load();
    m.startTour([], { seen: true });
    expect($("tour").hidden).toBe(true);
  });

  it("survives blocked storage", async () => {
    const m = await load();
    const boom = () => {
      throw new Error("blocked");
    };
    vi.stubGlobal("localStorage", { getItem: boom, setItem: boom });
    m.initTour();
    expect($("tour").hidden).toBe(false);
    expect(() => $("tourSkip").click()).not.toThrow();
    expect($("tour").hidden).toBe(true);
  });
});
