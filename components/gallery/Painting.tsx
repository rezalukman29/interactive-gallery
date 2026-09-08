import { Html, useTexture } from "@react-three/drei";
import { ThreeEvent, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useRef, useState } from "react";
import { Group, MathUtils } from "three";

type PaintingProps = {
  src: string;
  title: string;
  description: string;
  price: number;
  position: readonly [number, number, number];
  rotation?: readonly [number, number, number];
  size?: readonly [number, number];
  frameColor?: string;
  selected: boolean;
  onSelect: () => void;
};

const currencyFormatter = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0,
});

export function Painting({
  src,
  title,
  description,
  price,
  position,
  rotation = [0, 0, 0],
  size = [1.8, 2.4],
  frameColor = "#201914",
  selected,
  onSelect,
}: PaintingProps) {
  const artworkRef = useRef<Group>(null);
  const [hovered, setHovered] = useState(false);
  const invalidate = useThree((state) => state.invalidate);
  const texture = useTexture(src);
  const [width, height] = size;
  const selectedPopoverX = -width / 2 - 0.16;

  useEffect(() => {
    return () => {
      document.body.style.cursor = "default";
    };
  }, []);

  useFrame((_, delta) => {
    if (!artworkRef.current) return;

    const targetScale = hovered && !selected ? 1.035 : 1;
    const nextScale = MathUtils.damp(
      artworkRef.current.scale.x,
      targetScale,
      12,
      delta,
    );

    artworkRef.current.scale.set(nextScale, nextScale, 1);

    if (Math.abs(nextScale - targetScale) > 0.0001) {
      invalidate();
    }
  });

  const handleHover = (event: ThreeEvent<PointerEvent>, active: boolean) => {
    event.stopPropagation();
    setHovered(active);
    document.body.style.cursor = active ? "pointer" : "default";
    invalidate();
  };

  const handleSelect = (event: ThreeEvent<MouseEvent>) => {
    event.stopPropagation();
    onSelect();
  };

  return (
    <group
      ref={artworkRef}
      name={title}
      position={[...position]}
      rotation={[...rotation]}
    >
      <mesh
        castShadow
        position={[0, 0, 0]}
        onClick={handleSelect}
        onPointerEnter={(event) => handleHover(event, true)}
        onPointerLeave={(event) => handleHover(event, false)}
      >
        <boxGeometry args={[width + 0.12, height + 0.12, 0.04]} />
        <meshStandardMaterial
          color={frameColor}
          emissive={selected ? "#6b4825" : "#000000"}
          emissiveIntensity={selected ? 0.35 : 0}
          roughness={0.65}
        />
      </mesh>

      <mesh
        castShadow
        position={[0, 0, 0.035]}
        onClick={handleSelect}
        onPointerEnter={(event) => handleHover(event, true)}
        onPointerLeave={(event) => handleHover(event, false)}
      >
        <planeGeometry args={[width, height]} />
        <meshStandardMaterial map={texture} roughness={0.58} />
      </mesh>

      {selected ? (
        <Html
          position={[selectedPopoverX, 0, 0.2]}
          distanceFactor={3.4}
          style={{ pointerEvents: "none" }}
        >
          <aside
            className="painting-popover painting-popover--selected"
            aria-label={`Informasi ${title}`}
          >
            <p className="painting-popover__eyebrow">Koleksi galeri</p>
            <h2>{title}</h2>
            <p className="painting-popover__description">{description}</p>
            <strong>{currencyFormatter.format(price)}</strong>
          </aside>
        </Html>
      ) : hovered ? (
        <Html
          center
          position={[0, height / 2 + 0.48, 0.2]}
          distanceFactor={7.5}
          style={{ pointerEvents: "none" }}
        >
          <aside className="painting-popover" aria-label={`Informasi ${title}`}>
            <p className="painting-popover__eyebrow">Koleksi galeri</p>
            <h2>{title}</h2>
            <p className="painting-popover__description">{description}</p>
            <strong>{currencyFormatter.format(price)}</strong>
          </aside>
        </Html>
      ) : null}
    </group>
  );
}

useTexture.preload("/paintings/painting-1.jpg");
useTexture.preload("/paintings/painting-2.jpg?v=champions-1999");
useTexture.preload("/paintings/painting-3.jpg");
