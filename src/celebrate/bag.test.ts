import { describe, expect, it } from "vitest";
import { createBag } from "./bag";

const items = ["a", "b", "c", "d", "e"];
const draw = (next: () => string, n: number) =>
  Array.from({ length: n }, () => next());

// deterministic generator so the shuffle is reproducible
const seeded = (seed: number) => () => {
  seed = (seed * 1664525 + 1013904223) % 4294967296;
  return seed / 4294967296;
};

describe("createBag", () => {
  it("hands out every item exactly once per round", () => {
    const next = createBag(items, seeded(1));
    expect(draw(next, 5).sort()).toEqual(items);
    expect(draw(next, 5).sort()).toEqual(items);
    expect(draw(next, 5).sort()).toEqual(items);
  });

  it("is not just the original order (it actually shuffles)", () => {
    const orders = new Set<string>();
    for (let s = 1; s <= 20; s++)
      orders.add(draw(createBag(items, seeded(s)), 5).join());
    expect(orders.size).toBeGreaterThan(1);
  });

  it("never repeats the same item back to back, including across rounds", () => {
    for (let s = 1; s <= 200; s++) {
      const out = draw(createBag(items, seeded(s)), 5 * 40);
      for (let i = 1; i < out.length; i++) expect(out[i]).not.toBe(out[i - 1]);
    }
  });

  it("fixes the round seam when the reshuffle would start with the last item", () => {
    // random()=0 makes Fisher-Yates reverse nothing predictable; force the seam case:
    // a generator that always yields 0.999 leaves the array order unchanged,
    // so round two would start with "a" again unless the seam guard swaps it.
    const next = createBag(["a", "b"], () => 0.999);
    const out = draw(next, 6);
    for (let i = 1; i < out.length; i++) expect(out[i]).not.toBe(out[i - 1]);
    expect(out.slice(0, 2).sort()).toEqual(["a", "b"]);
  });

  it("does not touch the caller's array", () => {
    const source = [...items];
    const next = createBag(source, seeded(3));
    draw(next, 12);
    expect(source).toEqual(items);
  });

  it("works with a single item (a repeat is unavoidable)", () => {
    const next = createBag(["only"], seeded(1));
    expect(draw(next, 3)).toEqual(["only", "only", "only"]);
  });

  it("works when every item is identical", () => {
    const next = createBag(["x", "x"], seeded(1));
    expect(draw(next, 4)).toEqual(["x", "x", "x", "x"]);
  });

  it("throws for an empty list", () => {
    expect(() => createBag([])).toThrow();
  });

  it("uses Math.random by default", () => {
    const next = createBag(items);
    expect(draw(next, 5).sort()).toEqual(items);
  });
});
