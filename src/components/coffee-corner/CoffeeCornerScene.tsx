"use client";

import { Canvas, useThree } from "@react-three/fiber";
import { OrbitControls, OrthographicCamera, useGLTF } from "@react-three/drei";
import { BellRing, Package, Wrench } from "lucide-react";
import { Suspense, useEffect, useMemo, type ReactNode } from "react";
import { MathUtils } from "three";
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

  useEffect(() => {
    onReady?.();
  }, [onReady]);

  // Single baked mesh — never cull away its edges while orbiting.
  useMemo(() => {
    scene.traverse((o) => {
      o.frustumCulled = false;
    });
  }, [scene]);

  return <primitive object={scene} />;
}

/* ───────────── camera + controls ───────────── */
function FittedCamera() {
  const size = useThree((s) => s.size);
  // The isometric projection of the model is ≈1.3 world units wide/tall.
  // Wide canvases keep side gutters for the cards; narrow ones let the model
  // fill the stage because annotations shrink to small pills.
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
  // Keep vertical page-scroll alive on touch screens (OrbitControls forces `none`).
  useEffect(() => {
    gl.domElement.style.touchAction = "pan-y";
  }, [gl]);

  // Initial diagonal azimuth is 45°; allow a gentle ±22° / ±7° look-around.
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

/* ───────────── annotations ───────────── */
function Annotations({ models }: { models: PopupModels }) {
  const compact = useThree((s) => s.size.width) < COMPACT_BELOW;
  return (
    <>
      {ANCHORS.map((anchor) => {
        const model = models[anchor.id];
        return (
          <SceneAnnotation key={anchor.id} anchor={anchor} severity={model.severity} compact={compact}>
            <GlassmorphismPopup {...model} icon={ICONS[anchor.id]} compact={compact} />
          </SceneAnnotation>
        );
      })}
    </>
  );
}

/* ───────────── public scene ───────────── */
export interface CoffeeCornerSceneProps {
  readonly models: PopupModels;
  readonly onReady?: () => void;
}

export default function CoffeeCornerScene({ models, onReady }: CoffeeCornerSceneProps) {
  return (
    <Canvas
      // Static camera most of the time → render only on demand (controls/resizes invalidate).
      frameloop="demand"
      dpr={[1, 1.75]}
      gl={{ antialias: true, powerPreference: "high-performance", alpha: true, premultipliedAlpha: true }}
      // Fully transparent canvas: the page shows through, no frame, no backdrop.
      onCreated={({ gl }) => gl.setClearColor(0x000000, 0)}
      style={{ background: "transparent" }}
    >
      <FittedCamera />
      <Lights />
      <Suspense fallback={null}>
        <CoffeeCornerModel onReady={onReady} />
        <Annotations models={models} />
      </Suspense>
      <Controls />
    </Canvas>
  );
}

useGLTF.preload(MODEL_URL);
