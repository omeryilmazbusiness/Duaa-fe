"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Tracks viewport visibility of an element.
 * `seen` flips true once and stays true (used to lazy-mount heavy 3D chunks);
 * `visible` follows the element live (used to pause polling off-screen).
 */
export function useInView<T extends Element>(rootMargin = "240px") {
  const ref = useRef<T | null>(null);
  const [state, setState] = useState({ visible: false, seen: false });

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (typeof IntersectionObserver === "undefined") {
      setState({ visible: true, seen: true });
      return;
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        const visible = Boolean(entry?.isIntersecting);
        setState((prev) => (prev.visible === visible && (prev.seen || !visible) ? prev : { visible, seen: prev.seen || visible }));
      },
      { rootMargin },
    );
    io.observe(node);
    return () => io.disconnect();
  }, [rootMargin]);

  return { ref, ...state };
}
