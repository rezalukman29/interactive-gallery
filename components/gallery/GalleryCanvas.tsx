"use client";

import { Canvas } from "@react-three/fiber";
import { Suspense, useState } from "react";
import { GalleryScene, type GalleryFocusTarget } from "./GalleryScene";
import { HOME_POSITION } from "./galleryLayout";

export function GalleryCanvas() {
  const [selectedTarget, setSelectedTarget] =
    useState<GalleryFocusTarget | null>(null);
  const [vendingPanelOpen, setVendingPanelOpen] = useState(false);

  const handleBack = () => {
    setSelectedTarget(null);
    setVendingPanelOpen(false);
  };

  return (
    <div className="gallery-canvas">
      <Canvas
        aria-label="Galeri 3D dengan skylight, lukisan di tiga dinding, dan vending machine"
        camera={{ position: [...HOME_POSITION], fov: 58, near: 0.1, far: 50 }}
        dpr={[1, 1.75]}
        frameloop="demand"
        gl={{ antialias: true, powerPreference: "high-performance" }}
        shadows="percentage"
      >
        <Suspense fallback={null}>
          <GalleryScene
            selectedTarget={selectedTarget}
            onSelectTarget={setSelectedTarget}
            onOpenVendingPanel={() => {
              setVendingPanelOpen(true);
            }}
            vendingPanelOpen={vendingPanelOpen}
            onCloseVendingPanel={() => setVendingPanelOpen(false)}
          />
        </Suspense>
      </Canvas>

      {selectedTarget && (
        <button
          className="gallery-back"
          type="button"
          onClick={handleBack}
          aria-label={`Kembali dari ${selectedTarget.title} ke tampilan galeri`}
        >
          <span aria-hidden="true">←</span>
          Back
        </button>
      )}

      <a
        className="model-credit"
        href="https://sketchfab.com/3d-models/soda-vending-machine-f753a659faae499282e882d63972d4c2"
        target="_blank"
        rel="noreferrer"
      >
        Soda Vending Machine by RasenDan · CC BY 4.0
      </a>
    </div>
  );
}
