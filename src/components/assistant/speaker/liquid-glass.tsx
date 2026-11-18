import type { CSSProperties, ReactNode } from "react";
import { cn } from "@/lib/utils";

const GLASS_EASE = "cubic-bezier(0.175, 0.885, 0.32, 2.2)";
export const GLASS_FILTER_ID = "dua-glass-distortion";

/** Frosted liquid-glass surface; needs <GlassFilter /> mounted once on the page. */
export function GlassEffect({ children, className, style }: { children: ReactNode; className?: string; style?: CSSProperties }) {
  return (
    <div
      className={cn("relative flex overflow-hidden text-zinc-900 transition-all duration-700", className)}
      style={{
        boxShadow: "0 6px 6px rgba(0, 0, 0, 0.2), 0 0 20px rgba(0, 0, 0, 0.1)",
        transitionTimingFunction: GLASS_EASE,
        ...style,
      }}
    >
      <div
        className="absolute inset-0 z-0 overflow-hidden rounded-[inherit]"
        style={{
          backdropFilter: "blur(3px)",
          WebkitBackdropFilter: "blur(3px)",
          filter: `url(#${GLASS_FILTER_ID})`,
          isolation: "isolate",
        }}
        aria-hidden
      />
      <div className="absolute inset-0 z-10 rounded-[inherit]" style={{ background: "rgba(255, 255, 255, 0.25)" }} aria-hidden />
      <div
        className="absolute inset-0 z-20 overflow-hidden rounded-[inherit]"
        style={{ boxShadow: "inset 2px 2px 1px 0 rgba(255, 255, 255, 0.5), inset -1px -1px 1px 1px rgba(255, 255, 255, 0.5)" }}
        aria-hidden
      />
      <div className="relative z-30 w-full">{children}</div>
    </div>
  );
}

export function GlassFilter() {
  return (
    <svg style={{ position: "absolute", width: 0, height: 0 }} aria-hidden focusable="false">
      <filter id={GLASS_FILTER_ID} x="0%" y="0%" width="100%" height="100%" filterUnits="objectBoundingBox">
        <feTurbulence type="fractalNoise" baseFrequency="0.001 0.005" numOctaves="1" seed="17" result="turbulence" />
        <feComponentTransfer in="turbulence" result="mapped">
          <feFuncR type="gamma" amplitude="1" exponent="10" offset="0.5" />
          <feFuncG type="gamma" amplitude="0" exponent="1" offset="0" />
          <feFuncB type="gamma" amplitude="0" exponent="1" offset="0.5" />
        </feComponentTransfer>
        <feGaussianBlur in="turbulence" stdDeviation="3" result="softMap" />
        <feSpecularLighting in="softMap" surfaceScale="5" specularConstant="1" specularExponent="100" lightingColor="white" result="specLight">
          <fePointLight x="-200" y="-200" z="300" />
        </feSpecularLighting>
        <feComposite in="specLight" operator="arithmetic" k1="0" k2="1" k3="1" k4="0" result="litImage" />
        <feDisplacementMap in="SourceGraphic" in2="softMap" scale="200" xChannelSelector="R" yChannelSelector="G" />
      </filter>
    </svg>
  );
}
