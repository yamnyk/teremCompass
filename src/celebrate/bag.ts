// Shuffle-bag: hand out every item once in random order, then reshuffle and start over.
// The first item of a new round never equals the last one handed out, so the same
// item never appears twice in a row (unless every item is identical).
export function createBag<T>(
  items: readonly T[],
  random: () => number = Math.random,
): () => T {
  if (items.length === 0) throw new Error("createBag needs at least one item");
  let queue: T[] = [];
  let last: T | undefined;
  let hasLast = false;

  const refill = () => {
    queue = [...items];
    // Fisher-Yates
    for (let i = queue.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      [queue[i], queue[j]] = [queue[j]!, queue[i]!];
    }
    if (hasLast && queue[0] === last) {
      const others = queue.flatMap((x, i) => (x !== last ? [i] : []));
      if (others.length) {
        const k = others[Math.floor(random() * others.length)]!;
        [queue[0], queue[k]] = [queue[k]!, queue[0]!];
      }
    }
  };

  return () => {
    if (queue.length === 0) refill();
    last = queue.shift()!;
    hasLast = true;
    return last;
  };
}
