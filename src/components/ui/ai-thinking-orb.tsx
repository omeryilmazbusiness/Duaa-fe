"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

const TAU = Math.PI * 2;
const ORB_R = 66;
const CANVAS = 220;
const RINGS = 16;

function mulberry32(a: number) {
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const DOT_LIST = (() => {
  const rand = mulberry32(7);
  const out: { x: number; y: number; z: number; u: number; seed: number }[] = [];
  for (let k = 0; k < RINGS; k++) {
    const y = 1 - ((k + 0.5) / RINGS) * 2;
    const r = Math.sqrt(1 - y * y);
    const m = Math.max(4, Math.round(30 * r));
    for (let j = 0; j < m; j++) {
      const a = (j / m) * TAU + k * 0.35;
      out.push({
        x: Math.cos(a) * r,
        y,
        z: Math.sin(a) * r,
        u: (1 - y) / 2,
        seed: rand() * 6.283,
      });
    }
  }
  return out;
})();

const N = DOT_LIST.length;
const DX = Float32Array.from(DOT_LIST, (d) => d.x);
const DY = Float32Array.from(DOT_LIST, (d) => d.y);
const DZ = Float32Array.from(DOT_LIST, (d) => d.z);
const DU = Float32Array.from(DOT_LIST, (d) => d.u);
const DS = Float32Array.from(DOT_LIST, (d) => d.seed);

const G_STEPS = 24;
const A_STEPS = 48;

/** Cool silver → luminous emerald sweep. */
const COLORS: string[] = (() => {
  const out: string[] = [];
  for (let gi = 0; gi <= G_STEPS; gi++) {
    const g = gi / G_STEPS;
    const r = Math.round(lerp(186, 16, g));
    const gg = Math.round(lerp(200, 230, g));
    const b = Math.round(lerp(220, 140, g));
    for (let ai = 0; ai <= A_STEPS; ai++) {
      out.push(`rgba(${r},${gg},${b},${(ai / A_STEPS).toFixed(3)})`);
    }
  }
  return out;
})();

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}
function clamp01(v: number) {
  return v < 0 ? 0 : v > 1 ? 1 : v;
}
function easeOut(t: number) {
  return 1 - Math.pow(1 - t, 3);
}

type LoopPhase = "spin" | "green" | "fade";

export interface AiThinkingOrbProps {
  className?: string;
  /** Full loop length in ms (spin + green + fade). */
  cycleMs?: number;
  reducedMotion?: boolean;
}

/**
 * MorphOrb dotted globe — spins, turns emerald green, fades, loops.
 * Canvas-only decorative component for dark premium AI cards.
 */
export function AiThinkingOrb({ className, cycleMs = 7200, reducedMotion = false }: AiThinkingOrbProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = Math.round(CANVAS * dpr);
    canvas.height = Math.round(CANVAS * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const lit = new Float32Array(N);
    const SX = new Float32Array(N);
    const SY = new Float32Array(N);
    const SR = new Float32Array(N);
    const SD = new Float32Array(N);
    const SC = new Int16Array(N);
    const pw = [1, 0, 0, 0];

    let k = 0;
    let alpha = 0;
    let spin = 0.9;
    let rot = 0;
    let sweep = 0;
    let pop = 1;
    let gain = 1;
    let floor = 0;
    let rad = 0;
    let prog = 0;
    let time = 0;
    let raf = 0;
    let last = performance.now();
    let dead = false;
    let phase: LoopPhase = "spin";
    let phaseT0 = performance.now();

    const S = 0.6;
    const CP = Math.cos(0.35);
    const SP = Math.sin(0.35);
    const C0 = CANVAS / 2;

    const spinMs = cycleMs * 0.55;
    const greenMs = cycleMs * 0.28;
    const fadeMs = cycleMs * 0.17;

    const setPhase = (next: LoopPhase, now: number) => {
      phase = next;
      phaseT0 = now;
      if (next === "spin") {
        k = 0;
        alpha = 0;
        spin = 0.95;
        sweep = 0;
        pop = 1;
        gain = 1;
        floor = 0;
        rad = 0;
        prog = 0;
        lit.fill(0);
      }
    };

    const drivePhase = (now: number) => {
      if (reducedMotion) {
        k = 1;
        alpha = 1;
        spin = 0.15;
        sweep = 0.85;
        floor = 0.7;
        gain = 0.2;
        return;
      }
      const elapsed = now - phaseT0;
      if (phase === "spin") {
        const t = clamp01(elapsed / 900);
        k = easeOut(t);
        alpha = easeOut(t);
        spin = 0.85 + 0.2 * Math.sin(elapsed / 800);
        sweep = 0;
        floor = 0;
        gain = 1;
        prog = Math.floor((elapsed / 1150) % 4);
        if (elapsed >= spinMs) setPhase("green", now);
      } else if (phase === "green") {
        const t = clamp01(elapsed / greenMs);
        sweep = easeOut(t);
        spin = lerp(0.9, 0.25, t);
        gain = lerp(1, 0.15, t);
        floor = easeOut(Math.min(1, t * 1.4)) * 0.95;
        rad = easeOut(t) * 0.12;
        pop = t < 0.5 ? lerp(1, 1.05, t * 2) : lerp(1.05, 1, (t - 0.5) * 2);
        if (elapsed >= greenMs) setPhase("fade", now);
      } else {
        const t = clamp01(elapsed / fadeMs);
        alpha = 1 - easeOut(t);
        k = 1 - easeOut(t) * 0.35;
        sweep = 1;
        floor = 0.95 * (1 - t);
        if (elapsed >= fadeMs) setPhase("spin", now);
      }
    };

    const draw = (dt: number) => {
      ctx.clearRect(0, 0, CANVAS, CANVAS);
      time += dt;
      rot += spin * dt;

      const stepW = dt / 0.35;
      for (let q = 0; q < 4; q++) {
        const cur = pw[q] ?? 0;
        const d = (q === prog ? 1 : 0) - cur;
        pw[q] = cur + (Math.abs(d) <= stepW ? d : d > 0 ? stepW : -stepW);
      }
      const decay = Math.exp(-dt / 0.5);
      const h0 = (time * 300) % N;
      const h3 = (time * 480) % N;
      const a1 = time * 0.8;
      const b1 = Math.sin(time * 0.5) * 0.9;
      const f1x = Math.cos(b1) * Math.cos(a1);
      const f1y = Math.sin(b1);
      const f1z = Math.cos(b1) * Math.sin(a1);
      const a2 = time * 0.55 + 2.1;
      const b2 = Math.cos(time * 0.42) * 0.9;
      const f2x = Math.cos(b2) * Math.cos(a2);
      const f2y = Math.sin(b2);
      const f2z = Math.cos(b2) * Math.sin(a2);
      const lat = Math.sin(time * 2.2);
      const cyw = Math.cos(rot);
      const syw = Math.sin(rot);
      const pw0 = pw[0] ?? 0;
      const pw1 = pw[1] ?? 0;
      const pw2 = pw[2] ?? 0;
      const pw3 = pw[3] ?? 0;

      for (let n = 0; n < N; n++) {
        const dx = DX[n] ?? 0;
        const dy = DY[n] ?? 0;
        const dz = DZ[n] ?? 0;
        const u = DU[n] ?? 0;
        const seed = DS[n] ?? 0;

        let pulse = 0;
        if (pw0 > 0.001) {
          let dd = Math.abs(n - h0);
          if (dd > N - dd) dd = N - dd;
          const v = Math.max(0, 1 - dd / 16);
          pulse = Math.max(pulse, v * v * pw0);
        }
        if (pw1 > 0.001) {
          const v1 = Math.max(0, (dx * f1x + dy * f1y + dz * f1z - 0.72) / 0.28);
          const v2 = Math.max(0, (dx * f2x + dy * f2y + dz * f2z - 0.72) / 0.28);
          const v = Math.max(v1, v2);
          pulse = Math.max(pulse, v * v * pw1);
        }
        if (pw2 > 0.001) {
          const e = dy - lat;
          const v = Math.max(0, 1 - (e * e) / 0.02);
          pulse = Math.max(pulse, v * v * pw2);
        }
        if (pw3 > 0.001) {
          let dd = Math.abs(n - h3);
          if (dd > N - dd) dd = N - dd;
          const v = Math.max(0, 1 - dd / 22);
          pulse = Math.max(pulse, v * v * pw3);
        }
        const l = Math.max((lit[n] ?? 0) * decay, pulse * gain);
        lit[n] = l;

        const ki = clamp01(k * (1 + S) - S * u);
        if (ki <= 0.001) {
          SC[n] = -1;
          continue;
        }
        const eo = easeOut(ki);
        const kk = eo * pop;

        const x1 = dx * cyw + dz * syw;
        const z1 = -dx * syw + dz * cyw;
        const y2 = dy * CP - z1 * SP;
        const z2 = dy * SP + z1 * CP;
        const f = 2.8 / (2.8 - z2);
        const depth = (z2 + 1) / 2;
        const ox = x1 * ORB_R * kk * f;
        const oy = -y2 * ORB_R * kk * f;

        const g = clamp01((sweep * 1.4 - u) / 0.4);
        let a =
          0.1 +
          0.035 * Math.sin(seed + time * 1.6) * (1 - g) +
          0.32 * depth * depth +
          0.75 * l * (1 - g) +
          g * (0.55 + 0.4 * depth) +
          2 * g * (1 - g);
        a = Math.max(a, floor * (0.7 + 0.3 * depth));
        if (a > 1) a = 1;
        a *= eo * alpha;

        SX[n] = C0 + ox;
        SY[n] = C0 + oy;
        SD[n] = depth;
        SR[n] = (1.15 * (0.45 + 0.75 * depth) * f + 0.9 * l + g * 0.25) * (1 + rad) * (0.4 + 0.6 * eo);
        const ai = Math.round(a * A_STEPS);
        const gi = Math.round(g * G_STEPS);
        SC[n] = ai <= 0 ? -1 : gi * (A_STEPS + 1) + ai;
      }

      for (let pass = 0; pass < 2; pass++) {
        for (let n = 0; n < N; n++) {
          const c = SC[n] ?? -1;
          if (c < 0) continue;
          if ((SD[n] ?? 0) >= 0.5 !== (pass === 1)) continue;
          ctx.fillStyle = COLORS[c] ?? "transparent";
          ctx.beginPath();
          ctx.arc(SX[n] ?? 0, SY[n] ?? 0, SR[n] ?? 0, 0, TAU);
          ctx.fill();
        }
      }
    };

    const frame = (now: number) => {
      if (dead) return;
      const dt = reducedMotion ? 0.016 : Math.max(0, Math.min(0.05, (now - last) / 1000));
      last = now;
      drivePhase(now);
      draw(reducedMotion ? 0 : dt);
      raf = requestAnimationFrame(frame);
    };

    setPhase("spin", performance.now());
    raf = requestAnimationFrame(frame);

    return () => {
      dead = true;
      cancelAnimationFrame(raf);
    };
  }, [cycleMs, reducedMotion]);

  return (
    <div className={cn("relative aspect-square w-full max-w-[280px]", className)} aria-hidden data-testid="ai-thinking-orb">
      <div className="pointer-events-none absolute inset-[10%] rounded-full bg-[radial-gradient(circle,rgba(52,211,153,0.28),transparent_68%)] blur-2xl" />
      <canvas ref={canvasRef} className="relative block h-full w-full" />
    </div>
  );
}
