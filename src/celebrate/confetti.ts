import { $ } from '../lib/dom';
import { reduce } from '../lib/platform';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  s: number;
  r: number;
  vr: number;
  c: string;
  life: number;
}

export const fxTemplate = () => `<canvas id="fx"></canvas>`;

let fx: HTMLCanvasElement;
let ctx: CanvasRenderingContext2D;
let parts: Particle[] = [];

function sizeFx() {
  fx.width = innerWidth * devicePixelRatio;
  fx.height = innerHeight * devicePixelRatio;
}

export function initFx() {
  fx = $<HTMLCanvasElement>('fx');
  ctx = fx.getContext('2d')!;
  addEventListener('resize', sizeFx);
  sizeFx();
}

export function confetti() {
  if (reduce) return;
  const r = document.querySelector('.dial')!.getBoundingClientRect();
  const cx = (r.left + r.width / 2) * devicePixelRatio,
    cy = (r.top + r.height * 0.05) * devicePixelRatio;
  const cols = ['#ffc94a', '#ff4a2e', '#efe6d8', '#b8925a', '#3d8bff'];
  for (let i = 0; i < 160; i++) {
    const a = Math.random() * Math.PI * 2,
      v = (4 + Math.random() * 10) * devicePixelRatio;
    parts.push({
      x: cx,
      y: cy,
      vx: Math.cos(a) * v,
      vy: Math.sin(a) * v - 6 * devicePixelRatio,
      s: (4 + Math.random() * 6) * devicePixelRatio,
      r: Math.random() * 6,
      vr: (Math.random() - 0.5) * 0.4,
      c: cols[i % cols.length]!,
      life: 1,
    });
  }
}

export function drawFx() {
  ctx.clearRect(0, 0, fx.width, fx.height);
  parts = parts.filter((p) => p.life > 0);
  for (const p of parts) {
    p.vy += 0.35 * devicePixelRatio;
    p.vx *= 0.985;
    p.x += p.vx;
    p.y += p.vy;
    p.r += p.vr;
    p.life -= 0.008;
    ctx.save();
    ctx.globalAlpha = Math.max(0, p.life);
    ctx.translate(p.x, p.y);
    ctx.rotate(p.r);
    ctx.fillStyle = p.c;
    ctx.fillRect(-p.s / 2, -p.s / 4, p.s, p.s / 2);
    ctx.restore();
  }
}
