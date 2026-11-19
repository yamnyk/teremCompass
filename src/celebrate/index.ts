import { state } from "../state";
import { createBag } from "./bag";
import { triggerBoom } from "./boom";
import { cheers } from "./cheers";
import { confetti } from "./confetti";
import { ding } from "./sound";

const nextCheer = createBag(cheers);

export function celebrate() {
  if (Date.now() - state.lastBoom < 2500) return; // no spam if you wobble on the edge
  state.lastBoom = Date.now();
  triggerBoom(nextCheer());
  confetti();
  ding();
  navigator.vibrate?.([40, 30, 40, 30, 160]);
}
