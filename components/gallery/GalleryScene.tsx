import { useMemo } from "react";
import { Object3D } from "three";
import { Painting } from "./Painting";
import { CameraController } from "./CameraController";
import { VendingMachine } from "./VendingMachine";
import { GalleryRoom } from "./GalleryRoom";

type Vector3Tuple = readonly [number, number, number];

export type GalleryFocusTarget = {
  id: string;
  title: string;
  position: Vector3Tuple;
  cameraTarget: Vector3Tuple;
};

export type GalleryPainting = GalleryFocusTarget & {
  src: string;
  description: string;
  price: number;
  rotation: Vector3Tuple;
  size: readonly [number, number];
};

const paintings: readonly GalleryPainting[] = [
  {
    id: "dawn-lake",
    src: "/paintings/painting-1.jpg",
    title: "Danau Fajar",
    description: "Cahaya pertama yang jatuh perlahan di antara kabut dan pegunungan.",
    price: 18_500_000,
    position: [-4.86, 2.45, -2.2],
    rotation: [0, Math.PI / 2, 0],
    size: [1.8, 2.4],
    cameraTarget: [-1.86, 2.45, -2.2],
  },
  {
    id: "champions-1999",
    src: "/paintings/painting-2.jpg?v=champions-1999",
    title: "Champions of Europe 1999",
    description: "Perayaan malam bersejarah saat kejayaan Eropa kembali ke Manchester.",
    price: 32_000_000,
    position: [0, 2.45, -7.86],
    rotation: [0, 0, 0],
    size: [1.8, 2.4],
    cameraTarget: [0, 2.45, -4.86],
  },
  {
    id: "crescent-city",
    src: "/paintings/painting-3.jpg",
    title: "Kota Bulan Sabit",
    description: "Arsitektur imajiner yang tumbuh di antara laut, senja, dan bulan muda.",
    price: 21_000_000,
    position: [4.86, 2.45, -2.2],
    rotation: [0, -Math.PI / 2, 0],
    size: [1.6, 2.4],
    cameraTarget: [1.86, 2.45, -2.2],
  },
];

const vendingMachine: GalleryFocusTarget = {
  id: "soda-vending-machine",
  title: "Soda Vending Machine",
  position: [-3.3, 1.88, -6.25],
  cameraTarget: [-1.18, 1.9, -4.13],
};

const spotlights = [
  {
    position: [-1.4, 4.9, -3.7],
    target: vendingMachine.position,
  },
  {
    position: [-3, 5.1, -1],
    target: paintings[0].position,
  },
  {
    position: [0, 5.1, -5],
    target: paintings[1].position,
  },
  {
    position: [3, 5.1, -1],
    target: paintings[2].position,
  },
] as const;

type GallerySpotlightProps = {
  position: Vector3Tuple;
  target: Vector3Tuple;
};

function GallerySpotlight({ position, target }: GallerySpotlightProps) {
  const targetObject = useMemo(() => {
    const object = new Object3D();
    object.position.set(...target);
    return object;
  }, [target]);

  return (
    <>
      <primitive object={targetObject} />
      <spotLight
        castShadow
        color="#fff1d6"
        position={[...position]}
        target={targetObject}
        intensity={22}
        distance={12}
        angle={0.32}
        penumbra={0.75}
        decay={2}
        shadow-mapSize={[1024, 1024]}
        shadow-bias={-0.0002}
        shadow-normalBias={0.025}
      />
    </>
  );
}

type GallerySceneProps = {
  selectedTarget: GalleryFocusTarget | null;
  onSelectTarget: (target: GalleryFocusTarget) => void;
  onOpenVendingPanel: () => void;
  vendingPanelOpen: boolean;
  onCloseVendingPanel: () => void;
};

export function GalleryScene({
  selectedTarget,
  onSelectTarget,
  onOpenVendingPanel,
  vendingPanelOpen,
  onCloseVendingPanel,
}: GallerySceneProps) {
  return (
    <>
      <color attach="background" args={["#d5e7f2"]} />

      <ambientLight color="#fff5e7" intensity={0.65} />
      <hemisphereLight args={["#edf5ff", "#c8b797", 1.6]} />
      <directionalLight
        castShadow
        color="#fff0d4"
        intensity={3.2}
        position={[5, 12, 4]}
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-12}
        shadow-camera-right={12}
        shadow-camera-top={12}
        shadow-camera-bottom={-12}
        shadow-camera-near={0.5}
        shadow-camera-far={40}
        shadow-bias={-0.0001}
        shadow-normalBias={0.025}
      />
      {spotlights.map((light, index) => (
        <GallerySpotlight
          key={index}
          position={light.position}
          target={light.target}
        />
      ))}

      <GalleryRoom />

      {paintings.map((painting) => (
        <Painting
          key={painting.id}
          {...painting}
          selected={selectedTarget?.id === painting.id}
          onSelect={() => onSelectTarget(painting)}
        />
      ))}

      <VendingMachine
        position={vendingMachine.position}
        selected={selectedTarget?.id === vendingMachine.id}
        panelOpen={vendingPanelOpen}
        onSelect={() => onSelectTarget(vendingMachine)}
        onClosePanel={onCloseVendingPanel}
        onKeypadClick={() => {
          onSelectTarget(vendingMachine);
          onOpenVendingPanel();
        }}
      />

      <CameraController selectedTarget={selectedTarget} />
    </>
  );
}
