import { celebrate } from "./celebrate";
import { drawFx } from "./celebrate/confetti";
import { LOCK_IN, LOCK_OUT } from "./config";
import { $, root } from "./lib/dom";
import { norm } from "./lib/geo";
import { reduce } from "./lib/platform";
import { state } from "./state";
import { setRotation } from "./ui/dial";
import { hintText } from "./ui/hint";
import { setHint } from "./ui/readout";

function frame() {
  const k = reduce ? 1 : 0.22;
  if (state.heading !== null)
    state.shownRose += norm(-state.heading - state.shownRose) * k;
  if (state.target !== null)
    state.shownNeedle += norm(state.target - state.shownNeedle) * k;
  setRotation(state.shownRose, state.shownNeedle);

  if (state.target !== null && state.heading !== null) {
    const off = norm(state.target - state.heading),
      a = Math.abs(off);
    root.style.setProperty("--heat", Math.max(0, 1 - a / 90).toFixed(3));
    if (!state.locked && a < LOCK_IN) {
      state.locked = true;
      document.body.classList.add("locked");
      celebrate();
    } else if (state.locked && a > LOCK_OUT) {
      state.locked = false;
      document.body.classList.remove("locked");
    }
    setHint(hintText(state.locked, off, a));
  }
  drawFx();
  requestAnimationFrame(frame);
}

export function startLoop() {
  requestAnimationFrame(frame);
}
