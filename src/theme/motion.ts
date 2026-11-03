import type { Transition, Variants } from "framer-motion";

export const IOS_EASE = [0.32, 0.72, 0, 1] as const;

/** Selection liquid pill — snappy, premium. */
export const PILL_SPRING: Transition = {
  type: "spring",
  stiffness: 520,
  damping: 38,
  mass: 0.72,
};

export const DRAWER_SPRING: Transition = {
  type: "spring",
  stiffness: 420,
  damping: 38,
  mass: 0.85,
};

export const PANEL_SPRING: Transition = {
  type: "spring",
  stiffness: 360,
  damping: 34,
  mass: 0.8,
};

export const EXPAND_SPRING: Transition = {
  type: "spring",
  stiffness: 420,
  damping: 36,
  mass: 0.7,
};

/** Heavier stage / card transition (setup, staff lists). */
export const STAGE_SPRING: Transition = {
  type: "spring",
  stiffness: 280,
  damping: 30,
  mass: 0.9,
};

export const TAP_SPRING: Transition = {
  type: "spring",
  stiffness: 640,
  damping: 28,
  mass: 0.55,
};

export const PANEL_FADE = {
  duration: 0.34,
  ease: IOS_EASE,
};

export const PAGE_ENTER = {
  duration: 0.48,
  ease: IOS_EASE,
};

export const PRESS = {
  whileHover: { y: -2, scale: 1.015 },
  whileTap: { scale: 0.94, y: 0 },
  transition: TAP_SPRING,
} as const;

export const PRESS_SOFT = {
  whileHover: { scale: 1.02 },
  whileTap: { scale: 0.96 },
  transition: TAP_SPRING,
} as const;

type Slide = { dir: number; still: boolean };

/** Directional blur-slide used by setup cards and staff panels. */
export const SLIDE_CARD: Variants = {
  enter: ({ dir, still }: Slide) =>
    still
      ? { opacity: 0 }
      : { opacity: 0, x: dir * 72, scale: 0.94, filter: "blur(16px)" },
  center: { opacity: 1, x: 0, scale: 1, filter: "blur(0px)" },
  exit: ({ dir, still }: Slide) =>
    still
      ? { opacity: 0 }
      : { opacity: 0, x: dir * -72, scale: 0.94, filter: "blur(16px)" },
};

export const FADE_UP: Variants = {
  hidden: { opacity: 0, y: 18, filter: "blur(8px)" },
  show: { opacity: 1, y: 0, filter: "blur(0px)" },
};

export const STAGGER_PARENT: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.055, delayChildren: 0.04 } },
};
