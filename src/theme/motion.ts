export const IOS_EASE = [0.32, 0.72, 0, 1] as const;

export const PILL_SPRING = {
  type: "spring" as const,
  stiffness: 520,
  damping: 38,
  mass: 0.72,
};

export const DRAWER_SPRING = {
  type: "spring" as const,
  stiffness: 420,
  damping: 38,
  mass: 0.85,
};

export const PANEL_SPRING = {
  type: "spring" as const,
  stiffness: 360,
  damping: 34,
  mass: 0.8,
};

export const EXPAND_SPRING = {
  type: "spring" as const,
  stiffness: 420,
  damping: 36,
  mass: 0.7,
};

export const PANEL_FADE = {
  duration: 0.34,
  ease: IOS_EASE,
};

export const PAGE_ENTER = {
  duration: 0.42,
  ease: IOS_EASE,
};
