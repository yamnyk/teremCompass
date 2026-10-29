import { t } from "../i18n";
import { $ } from "../lib/dom";
import { rad } from "../lib/geo";

export const dialTemplate = () => `<div class="dial" aria-hidden="true">
    <svg viewBox="-120 -120 240 240">
      <circle r="96" fill="var(--dial)"/>
      <g id="rose">
        <g id="ticks" stroke="var(--muted)"></g>
        <text y="-70" text-anchor="middle" fill="var(--fg)" font-size="12" font-weight="700">${t.dial.north}</text>
        <text y="80" text-anchor="middle" fill="var(--muted)" font-size="11" font-weight="700">${t.dial.south}</text>
        <text x="76" y="4" text-anchor="middle" fill="var(--muted)" font-size="11" font-weight="700">${t.dial.east}</text>
        <text x="-76" y="4" text-anchor="middle" fill="var(--muted)" font-size="11" font-weight="700">${t.dial.west}</text>

        <!-- everything pointing at Teremky; rotated to bearing -->
        <g id="needle" visibility="hidden">
          <!-- ±8° target window on the rim -->
          <path d="M0,0 L-13.4,-95.1 A96,96 0 0 1 13.4,-95.1 Z" fill="var(--hot)" opacity=".18"/>
          <path d="M-13.4,-95.1 A96,96 0 0 1 13.4,-95.1" fill="none" stroke="var(--hot)" stroke-width="5" stroke-linecap="round"/>
          <!-- beam -->
          <polygon points="0,-58 8,4 0,-2 -8,4" fill="var(--hot)"/>
          <polygon points="0,52 8,4 0,-2 -8,4" fill="var(--muted)" opacity=".3"/>
          <!-- teremok pin outside the ring -->
          <g id="pin" transform="translate(0,-109)">
            <circle id="pinPulse" r="10" fill="var(--hot)"/>
            <circle r="11" fill="var(--hot)"/>
            <path d="M-6,5 V-1 L0,-7 L6,-1 V5 Z" fill="var(--bg)"/>
            <rect x="-1.6" y="0" width="3.2" height="5" fill="var(--hot)"/>
          </g>
        </g>
      </g>
      <circle id="ringOuter" r="96" fill="none" stroke-width="2.5"/>
      <circle r="5" fill="var(--ring)"/>
      <!-- fixed notch = where phone top points; pin docks here when aimed -->
      <path d="M-14,-124 L14,-124 L0,-99 Z" fill="none" stroke="var(--fg)" stroke-width="2" stroke-linejoin="round" opacity=".85"/>
    </svg>
  </div>`;

export function buildTicks() {
  const ticks = $("ticks");
  for (let i = 0; i < 72; i++) {
    const a = rad(i * 5),
      big = i % 6 === 0;
    const r1 = big ? 84 : 88,
      r2 = 92;
    const l = document.createElementNS("http://www.w3.org/2000/svg", "line");
    l.setAttribute("x1", String(Math.sin(a) * r1));
    l.setAttribute("y1", String(-Math.cos(a) * r1));
    l.setAttribute("x2", String(Math.sin(a) * r2));
    l.setAttribute("y2", String(-Math.cos(a) * r2));
    l.setAttribute("stroke-width", String(big ? 1.6 : 0.8));
    ticks.appendChild(l);
  }
}

// SVG attr rotates around (0,0) = dial centre (CSS transform-origin breaks in iOS WebKit)
export function setRotation(shownRose: number, shownNeedle: number) {
  $("rose").setAttribute("transform", `rotate(${shownRose.toFixed(2)})`);
  $("needle").setAttribute("transform", `rotate(${shownNeedle.toFixed(2)})`);
}
