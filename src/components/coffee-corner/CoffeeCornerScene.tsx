"use client";

import { Canvas, useThree } from "@react-three/fiber";
import { OrbitControls, OrthographicCamera, useGLTF } from "@react-three/drei";
import { BellRing, Package, Wrench } from "lucide-react";
import { Suspense, useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { MathUtils } from "three";
import { AnnotationProjector, type ScreenPoints } from "./AnnotationProjector";
import { ANCHORS, CAMERA, MODEL_URL } from "./anchors";
import { GlassmorphismPopup } from "./GlassmorphismPopup";
import type { PopupModels } from "./popupModels";
import { SceneAnnotation } from "./SceneAnnotation";
import type { StreamId } from "./types";

const ICONS: Record<StreamId, ReactNode> = {
  stock: <Package className="h-3.5 w-3.5" strokeWidth={1.8} />,
  requests: <BellRing className="h-3.5 w-3.5" strokeWidth={1.8} />,
  faults: <Wrench className="h-3.5 w-3.5" strokeWidth={1.8} />,
};

/** Below this canvas width popups collapse into compact pills. */
const COMPACT_BELOW = 760;

/* ───────────── model ───────────── */
function CoffeeCornerModel({ onReady }: { onReady?: () => void }) {
  const { scene } = useGLTF(MODEL_URL);
  const invalidate = useThree((s) => s.invalidate);

  useEffect(() => {
    scene.traverse((o) => {
      o.frustumCulled = false;
    });
    onReady?.();
    invalidate();
  }, [scene, onReady, invalidate]);

  return <primitive object={scene} />;
}

/* ───────────── camera + controls ───────────── */
function FittedCamera() {
  const size = useThree((s) => s.size);
  const gutter = size.width < COMPACT_BELOW ? 1.7 : 2.5;
  const zoom = Math.max(60, Math.min(size.height / 1.5, size.width / gutter));
  return (
    <OrthographicCamera
      makeDefault
      position={CAMERA.position as [number, number, number]}
      zoom={zoom}
      near={CAMERA.near}
      far={CAMERA.far}
    />
  );
}

function Controls() {
  const gl = useThree((s) => s.gl);

  useEffect(() => {
    gl.domElement.style.touchAction = "pan-y";
  }, [gl]);

  const polar = Math.atan2(Math.hypot(CAMERA.position[0], CAMERA.position[2]), CAMERA.position[1]);
  const azimuth = Math.atan2(CAMERA.position[0], CAMERA.position[2]);

  return (
    <OrbitControls
      makeDefault
      target={CAMERA.target as [number, number, number]}
      enableZoom={false}
      enablePan={false}
      enableDamping
      dampingFactor={0.08}
      rotateSpeed={0.5}
      minPolarAngle={polar - MathUtils.degToRad(7)}
      maxPolarAngle={polar + MathUtils.degToRad(7)}
      minAzimuthAngle={azimuth - MathUtils.degToRad(22)}
      maxAzimuthAngle={azimuth + MathUtils.degToRad(22)}
    />
  );
}

function Lights() {
  return (
    <>
      <ambientLight intensity={0.85} />
      <hemisphereLight args={["#fff3e0", "#3a2a1e", 0.55]} />
      <directionalLight position={[3, 5, 2.5]} intensity={1.6} color="#fff1dc" />
      <directionalLight position={[-3, 2.5, -2]} intensity={0.5} color="#bcd4ff" />
    </>
  );
}

/* ───────────── public scene ───────────── */
export interface CoffeeCornerSceneProps {
  readonly models: PopupModels;
  readonly onReady?: () => void;
}

export default function CoffeeCornerScene({ models, onReady }: CoffeeCornerSceneProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [points, setPoints] = useState<ScreenPoints | null>(null);
  const [compact, setCompact] = useState(false);
  const onProject = useCallback((next: ScreenPoints) => setPoints(next), []);

  useEffect(() => {
    const node = rootRef.current;
    if (!node) return;
    const sync = () => setCompact(node.clientWidth < COMPACT_BELOW);
    sync();
    const ro = new ResizeObserver(sync);
    ro.observe(node);
    return () => ro.disconnect();
  }, []);

  return (
    <div className="relative h-full w-full" ref={rootRef}>
      <Canvas
        frameloop="demand"
        dpr={[1, 1.75]}
        gl={{ antialias: true, powerPreference: "high-performance", alpha: true, premultipliedAlpha: true }}
        onCreated={({ gl }) => gl.setClearColor(0x000000, 0)}
        style={{ background: "transparent" }}
        className="absolute inset-0 h-full w-full"
      >
        <FittedCamera />
        <Lights />
        <Suspense fallback={null}>
          <CoffeeCornerModel onReady={onReady} />
        </Suspense>
        <AnnotationProjector onUpdate={onProject} />
        <Controls />
      </Canvas>

      {/* DOM overlays — never mount through drei Html (React 19 root race). */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {points
          ? ANCHORS.map((anchor) => {
              const model = models[anchor.id];
              const screen = points[anchor.id];
              if (!screen) return null;
              return (
                <SceneAnnotation
                  key={anchor.id}
                  screen={screen}
                  offset={compact ? anchor.offsetCompact : anchor.offset}
                  severity={model.severity}
                >
                  <GlassmorphismPopup {...model} icon={ICONS[anchor.id]} compact={compact} />
                </SceneAnnotation>
              );
            })
          : null}
      </div>
    </div>
  );
}

useGLTF.preload(MODEL_URL);
