import { $ } from "./lib/dom";
import { state } from "./state";
import { showDistance } from "./ui/readout";

// debug on desktop: ?demo → fake GPS + slow spin, so you can see the boom without a phone
export function initDemo() {
  if (location.search.includes("demo")) {
    state.target = 57;
    state.shownNeedle = 57;
    $("needle").setAttribute("visibility", "visible");
    showDistance(3139);
    $("go").hidden = true;
    let h = 0;
    setInterval(() => {
      h = (h + 1.5) % 360;
      state.heading = h;
    }, 30);
  }
}
