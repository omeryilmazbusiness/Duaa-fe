"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import { Vector3 } from "three";
import { ANCHORS } from "./anchors";
import type { ScreenAnchor } from "./SceneAnnotation";
import type { StreamId } from "./types";

export type ScreenPoints = Record<StreamId, ScreenAnchor>;

function fingerprint(points: ScreenPoints): string {
  return ANCHORS.map((a) => {
    const p = points[a.id];
    return `${a.id}:${p.visible ? 1 : 0}:${p.x.toFixed(1)}:${p.y.toFixed(1)}`;
  }).join("|");
}

/**
 * Projects anchor world positions into canvas CSS pixels.
 * Lives inside the R3F tree; pushes results out so DOM overlays never use drei `<Html>`.
 */
export function AnnotationProjector({ onUpdate }: { onUpdate: (points: ScreenPoints) => void }) {
  const camera = useThree((s) => s.camera);
  const size = useThree((s) => s.size);
  const invalidate = useThree((s) => s.invalidate);
  const scratch = useRef(new Vector3());
  const last = useRef("");
  const onUpdateRef = useRef(onUpdate);
  onUpdateRef.current = onUpdate;

  useFrame(() => {
    const v = scratch.current;
    const next = {} as ScreenPoints;
    for (const anchor of ANCHORS) {
      v.set(anchor.position[0], anchor.position[1], anchor.position[2]);
      v.project(camera);
      next[anchor.id] = {
        x: (v.x * 0.5 + 0.5) * size.width,
        y: (-v.y * 0.5 + 0.5) * size.height,
        visible: Number.isFinite(v.x) && Number.isFinite(v.y) && v.z >= -1 && v.z <= 1,
      };
    }
    const key = fingerprint(next);
    if (key === last.current) return;
    last.current = key;
    onUpdateRef.current(next);
  });

  // Demand frameloop: force a paint after resize / camera swap so useFrame runs once.
  useEffect(() => {
    invalidate();
  }, [camera, size.width, size.height, invalidate]);

  return null;
}
