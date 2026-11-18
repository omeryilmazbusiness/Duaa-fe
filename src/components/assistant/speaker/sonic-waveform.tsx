"use client";

import { useReducedMotion } from "framer-motion";
import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

export interface SonicWaveformProps {
  /** 0–1 voice level — drives wave height and glow. */
  amplitude?: number;
  /** When false, animation pauses and canvas clears. */
  active?: boolean;
  /** Synthetic motion when there is no mic level (AI speaking or thinking). */
  simulate?: boolean;
  className?: string;
  theme?: "light" | "dark";
  showTrail?: boolean;
}

const AI_PALETTE = [
  { r: 56, g: 189, b: 248 },
  { r: 99, g: 102, b: 241 },
  { r: 168, g: 85, b: 247 },
  { r: 244, g: 114, b: 182 },
  { r: 251, g: 146, b: 60 },
] as const;

function paletteColor(progress: number, alpha: number): string {
  const scaled = progress * (AI_PALETTE.length - 1);
  const i = Math.floor(scaled);
  const t = scaled - i;
  const a = AI_PALETTE[Math.min(i, AI_PALETTE.length - 1)] ?? AI_PALETTE[0];
  const b = AI_PALETTE[Math.min(i + 1, AI_PALETTE.length - 1)] ?? a;
  const r = Math.round(a.r + (b.r - a.r) * t);
  const g = Math.round(a.g + (b.g - a.g) * t);
  const bl = Math.round(a.b + (b.b - a.b) * t);
  return `rgba(${r}, ${g}, ${bl}, ${alpha})`;
}

function resolveEnergy(rawAmp: number, time: number, active: boolean, simulate: boolean): number {
  if (!active) return 0;
  const synthetic = 0.38 + Math.sin(time * 2.4) * 0.2 + Math.sin(time * 3.9 + 0.6) * 0.12 + Math.sin(time * 5.1 + 1.2) * 0.06;
  if (simulate) return synthetic;
  const live = Math.min(Math.max(rawAmp, 0), 1);
  const baseline = 0.14 + Math.sin(time * 1.6) * 0.06;
  return Math.max(live, baseline);
}

/** Amplitude-reactive sonic waveform — AI spectrum colours on a contained canvas. */
export function SonicWaveform({
  amplitude = 0,
  active = true,
  simulate = false,
  className,
  theme = "light",
  showTrail = true,
}: SonicWaveformProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ampRef = useRef(amplitude);
  const activeRef = useRef(active);
  const simulateRef = useRef(simulate);
  const trailRef = useRef(showTrail);
  const reduceMotion = useReducedMotion();

  ampRef.current = amplitude;
  activeRef.current = active && !reduceMotion;
  simulateRef.current = simulate;
  trailRef.current = showTrail;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let frame = 0;
    let time = 0;

    const resize = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = parent.clientWidth;
      const h = parent.clientHeight;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const draw = () => {
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      if (!activeRef.current || document.hidden) {
        ctx.clearRect(0, 0, w, h);
        frame = requestAnimationFrame(draw);
        return;
      }
      const amp = resolveEnergy(ampRef.current, time, activeRef.current, simulateRef.current);
      const ampBoost = 1 + amp * 2.8;
      const centerY = h / 2;
      ctx.clearRect(0, 0, w, h);
      if (trailRef.current) {
        ctx.fillStyle = theme === "dark" ? "rgba(0, 0, 0, 0.12)" : "rgba(248, 248, 248, 0.35)";
        ctx.fillRect(0, 0, w, h);
      }
      const lineCount = 48;
      const segmentCount = Math.max(40, Math.floor(w / 5));
      for (let i = 0; i < lineCount; i++) {
        const progress = i / (lineCount - 1);
        const envelope = Math.sin(progress * Math.PI);
        const alpha = envelope * (0.22 + amp * 0.45);
        ctx.beginPath();
        ctx.strokeStyle = paletteColor(progress, alpha);
        ctx.lineWidth = 1.2 + amp * 0.8;
        for (let j = 0; j <= segmentCount; j++) {
          const x = (j / segmentCount) * w;
          const centerPull = 1 - Math.abs(x - w / 2) / (w / 2);
          const noise = Math.sin(j * 0.14 + time + i * 0.18) * (8 + amp * 14) * envelope;
          const spike =
            Math.cos(j * 0.22 + time * 1.1 + i * 0.12) * Math.sin(j * 0.06 + time * 0.85) * (18 + amp * 42) * envelope * centerPull;
          const y = centerY + (noise + spike) * ampBoost * centerPull;
          if (j === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }
      time += 0.028 + amp * 0.018;
      frame = requestAnimationFrame(draw);
    };

    const observer = new ResizeObserver(resize);
    if (canvas.parentElement) observer.observe(canvas.parentElement);
    resize();
    draw();
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, [theme, reduceMotion]);

  return <canvas ref={canvasRef} className={cn("pointer-events-none absolute inset-0 h-full w-full", className)} aria-hidden />;
}
