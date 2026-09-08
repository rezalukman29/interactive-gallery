import { useMemo } from "react";
import { Object3D } from "three";
import { Painting } from "./Painting";
import { CameraController } from "./CameraController";
import { VendingMachine } from "./VendingMachine";

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

const ROOM = {
  width: 12,
  height: 6,
  depth: 10,
  wallThickness: 0.2,
} as const;

const paintings: readonly GalleryPainting[] = [
  {
    id: "dawn-lake",
    src: "/paintings/painting-1.jpg",
    title: "Danau Fajar",
    description: "Cahaya pertama yang jatuh perlahan di antara kabut dan pegunungan.",
    price: 18_500_000,
    position: [-5.86, 2.45, -2.2],
    rotation: [0, Math.PI / 2, 0],
    size: [1.8, 2.4],
    cameraTarget: [-2.86, 2.45, -2.2],
  },
  {
    id: "champions-1999",
    src: "/paintings/painting-2.jpg?v=champions-1999",
    title: "Champions of Europe 1999",
    description: "Perayaan malam bersejarah saat kejayaan Eropa kembali ke Manchester.",
    price: 32_000_000,
    position: [0, 2.45, -4.86],
    rotation: [0, 0, 0],
    size: [1.8, 2.4],
    cameraTarget: [0, 2.45, -1.86],
  },
  {
    id: "crescent-city",
    src: "/paintings/painting-3.jpg",
    title: "Kota Bulan Sabit",
    description: "Arsitektur imajiner yang tumbuh di antara laut, senja, dan bulan muda.",
    price: 21_000_000,
    position: [5.86, 2.45, -2.2],
    rotation: [0, -Math.PI / 2, 0],
    size: [1.6, 2.4],
    cameraTarget: [2.86, 2.45, -2.2],
  },
];

const vendingMachine: GalleryFocusTarget = {
  id: "soda-vending-machine",
  title: "Soda Vending Machine",
  position: [-4.45, 1.88, -3.55],
  cameraTarget: [-2.33, 1.9, -1.43],
};

const spotlights = [
  {
    position: [-2.2, 5, -0.6],
    target: [-4.45, 1.9, -3.55],
  },
  {
    position: [-3.6, 5.35, -0.8],
    target: [-5.86, 2.45, -2.2],
  },
  {
    position: [0, 5.4, 0.5],
    target: [0, 2.45, -4.86],
  },
  {
    position: [3.6, 5.35, -0.8],
    target: [5.86, 2.45, -2.2],
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
        intensity={45}
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
      <color attach="background" args={["#11100e"]} />

      <ambientLight color="#fff4df" intensity={0.42} />
      {spotlights.map((light, index) => (
        <GallerySpotlight
          key={index}
          position={light.position}
          target={light.target}
        />
      ))}

      <mesh receiveShadow position={[0, -0.1, 0]}>
        <boxGeometry args={[ROOM.width, ROOM.wallThickness, ROOM.depth]} />
        <meshStandardMaterial color="#302a24" roughness={0.8} />
      </mesh>

      <mesh receiveShadow position={[0, ROOM.height / 2, -ROOM.depth / 2]}>
        <boxGeometry args={[ROOM.width, ROOM.height, ROOM.wallThickness]} />
        <meshStandardMaterial color="#d8d2c6" roughness={0.92} />
      </mesh>

      <mesh receiveShadow position={[-ROOM.width / 2, ROOM.height / 2, 0]}>
        <boxGeometry args={[ROOM.wallThickness, ROOM.height, ROOM.depth]} />
        <meshStandardMaterial color="#cbc4b8" roughness={0.92} />
      </mesh>

      <mesh receiveShadow position={[ROOM.width / 2, ROOM.height / 2, 0]}>
        <boxGeometry args={[ROOM.wallThickness, ROOM.height, ROOM.depth]} />
        <meshStandardMaterial color="#cbc4b8" roughness={0.92} />
      </mesh>

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
