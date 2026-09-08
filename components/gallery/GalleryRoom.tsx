import { GALLERY_ROOM as ROOM } from "./galleryLayout";

type RoomBoxProps = {
  position: [number, number, number];
  size: [number, number, number];
  color?: string;
  roughness?: number;
};

function RoomBox({ position, size, color = "#e4dccb", roughness = 0.86 }: RoomBoxProps) {
  return (
    <mesh castShadow receiveShadow position={position}>
      <boxGeometry args={size} />
      <meshStandardMaterial color={color} roughness={roughness} />
    </mesh>
  );
}

/** Geometry inspired by the reference image; perspective follows the real camera. */
export function GalleryRoom() {
  const halfWidth = ROOM.width / 2;
  const halfDepth = ROOM.depth / 2;
  const roofWingWidth = (ROOM.width - ROOM.skylightWidth) / 2;

  return (
    <group name="Skylight gallery architecture">
      <RoomBox position={[0, -0.1, 0]} size={[ROOM.width, 0.2, ROOM.depth]} color="#cbb89b" roughness={0.48} />
      <RoomBox position={[0, ROOM.height / 2, -halfDepth]} size={[ROOM.width, ROOM.height, ROOM.wallThickness]} color="#e8e0d2" />
      <RoomBox position={[-halfWidth, ROOM.height / 2, 0]} size={[ROOM.wallThickness, ROOM.height, ROOM.depth]} color="#e5decf" />

      {/* A real opening in the rear of the right wall, with a recessed alcove. */}
      <RoomBox position={[halfWidth, ROOM.height / 2, 1]} size={[ROOM.wallThickness, ROOM.height, 14]} color="#e9e1d4" />
      <RoomBox position={[halfWidth, 4.65, -7]} size={[ROOM.wallThickness, 2.3, 2]} />
      <RoomBox position={[6.4, 1.75, -7]} size={[0.2, 3.5, 2.2]} color="#d3ccbf" />
      <RoomBox position={[5.7, -0.1, -7]} size={[1.4, 0.2, 2]} color="#cbb89b" roughness={0.48} />
      {[-8, -6].map((z) => (
        <RoomBox key={z} position={[5.7, 1.75, z]} size={[1.4, 3.5, 0.2]} />
      ))}

      {/* Solid roof wings leave an open strip through which daylight enters. */}
      {[-1, 1].map((side) => (
        <group key={side}>
          <RoomBox
            position={[side * (ROOM.skylightWidth / 2 + roofWingWidth / 2), ROOM.height, 0]}
            size={[roofWingWidth, 0.24, ROOM.depth]}
          />
          <RoomBox position={[side * ROOM.skylightWidth / 2, 5.55, 0]} size={[0.32, 0.5, ROOM.depth]} />
          <RoomBox position={[side * (ROOM.skylightWidth / 2 - 0.18), 5.87, 0]} size={[0.045, 0.06, ROOM.depth]} color="#766955" />
          <RoomBox position={[side * 4.86, 0.055, 0]} size={[0.025, 0.11, ROOM.depth]} color="#b7a990" />
        </group>
      ))}
      {[-7.8, -4, 0, 4, 7.8].map((z) => (
        <RoomBox key={z} position={[0, 5.55, z]} size={[ROOM.width, 0.5, 0.3]} />
      ))}

      {/* Recessed ventilation grille above the central artwork. */}
      <RoomBox position={[0, 4.65, -7.85]} size={[2.35, 0.42, 0.06]} color="#8a7a60" />
      <RoomBox position={[0, 4.65, -7.80]} size={[2.2, 0.29, 0.04]} color="#3c382f" />
      {Array.from({ length: 32 }, (_, index) => (
        <RoomBox key={index} position={[-1.05 + index * 0.068, 4.65, -7.77]} size={[0.018, 0.27, 0.015]} color="#665e4e" />
      ))}
    </group>
  );
}
