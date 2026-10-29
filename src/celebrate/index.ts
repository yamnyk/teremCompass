import { t } from "../i18n";
import { state } from "../state";
import { triggerBoom } from "./boom";
import { confetti } from "./confetti";
import { ding } from "./sound";

export function celebrate() {
  if (Date.now() - state.lastBoom < 2500) return; // no spam if you wobble on the edge
  state.lastBoom = Date.now();
  triggerBoom(t.cheers[Math.floor(Math.random() * t.cheers.length)]!);
  confetti();
  ding();
  navigator.vibrate?.([40, 30, 40, 30, 160]);
}
