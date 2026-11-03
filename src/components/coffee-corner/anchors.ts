import type { StreamId } from "./types";

/**
 * Where each data stream lives on the model (object-space coordinates of the
 * single baked mesh, bounds ≈ x ±0.42, y -0.35…0.37, z ±0.49) and where its
 * popup floats in screen space. Pure configuration — tune here, never in JSX.
 */
export interface AnchorConfig {
  readonly id: StreamId;
  /** Object-space point the connector line touches. */
  readonly position: readonly [number, number, number];
  /** Popup offset from the anchor, in CSS px (desktop). */
  readonly offset: readonly [number, number];
  /** Popup offset on narrow canvases. */
  readonly offsetCompact: readonly [number, number];
}

export const MODEL_URL = "/models/StockCake-3d-generator-Cozy_Coffee_Corner-3331688.glb";

export const ANCHORS: readonly AnchorConfig[] = [
  // Dry-goods shelves on the left wall.
  { id: "stock", position: [-0.333, 0.172, 0.039], offset: [-110, -20], offsetCompact: [-22, -34] },
  // Espresso machine on the left counter.
  { id: "faults", position: [-0.234, 0.06, 0.143], offset: [-110, 85], offsetCompact: [-38, 26] },
  // Order / hand-off point on the front counter.
  { id: "requests", position: [0.264, -0.03, 0.022], offset: [140, -10], offsetCompact: [40, 22] },
];

/** Isometric-style diagonal camera. */
export const CAMERA = {
  position: [2.6, 2.3, 2.6] as const,
  target: [0, 0, 0] as const,
  near: 0.1,
  far: 20,
};
