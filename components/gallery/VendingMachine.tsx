import { Clone, Edges, Html, useGLTF } from "@react-three/drei";
import { ThreeEvent, useFrame, useThree } from "@react-three/fiber";
import { FormEvent, useEffect, useRef, useState } from "react";
import { Group, MathUtils } from "three";

const MODEL_PATH = "/model/soda_vending_machine.glb";
const MODEL_SCALE = 1.88;

const KEYPAD_HITBOX = {
  position: [-0.35, 0.26, -0.47],
  size: [0.17, 0.27, 0.005],
} as const;

type VendingMachineProps = {
  position: readonly [number, number, number];
  selected: boolean;
  panelOpen: boolean;
  onSelect: () => void;
  onClosePanel: () => void;
  onKeypadClick: () => void;
};

export function VendingMachine({
  position,
  selected,
  panelOpen,
  onSelect,
  onClosePanel,
  onKeypadClick,
}: VendingMachineProps) {
  const groupRef = useRef<Group>(null);
  const [hovered, setHovered] = useState(false);
  const [keypadHovered, setKeypadHovered] = useState(false);
  const [code, setCode] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const invalidate = useThree((state) => state.invalidate);
  const { scene } = useGLTF(MODEL_PATH);

  useEffect(() => {
    return () => {
      document.body.style.cursor = "default";
    };
  }, []);

  useFrame((_, delta) => {
    if (!groupRef.current) return;

    const targetScale =
      hovered && !selected ? MODEL_SCALE * 1.035 : MODEL_SCALE;
    const nextScale = MathUtils.damp(
      groupRef.current.scale.x,
      targetScale,
      12,
      delta,
    );

    groupRef.current.scale.setScalar(nextScale);

    if (Math.abs(nextScale - targetScale) > 0.0001) {
      invalidate();
    }
  });

  const handleHover = (active: boolean) => {
    setHovered(active);
    document.body.style.cursor = active ? "pointer" : "default";
    invalidate();
  };

  const handleSelect = () => {
    setKeypadHovered(false);
    onSelect();
  };

  const handleKeypadClick = (event: ThreeEvent<MouseEvent>) => {
    event.stopPropagation();
    console.info("[VendingMachine] Keypad hitbox clicked", {
      object: event.object.name,
      point: event.point.toArray(),
      uv: event.uv?.toArray() ?? null,
    });
    onKeypadClick();
  };

  const handleKeypadHover = (
    event: ThreeEvent<PointerEvent>,
    active: boolean,
  ) => {
    event.stopPropagation();
    setKeypadHovered(active);
    setHovered(active);
    document.body.style.cursor = active ? "pointer" : "default";
    invalidate();
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const normalizedCode = code.trim().toUpperCase();

    if (!normalizedCode) return;

    setCode(normalizedCode);
    setMessage(`Kode ${normalizedCode} berhasil dipilih.`);
  };

  return (
    <group
      ref={groupRef}
      name="Soda Vending Machine"
      position={[...position]}
      rotation={[0, Math.PI + Math.PI / 5, 0]}
      scale={MODEL_SCALE}
      onClick={handleSelect}
      onPointerEnter={() => handleHover(true)}
      onPointerLeave={() => handleHover(false)}
    >
      <Clone object={scene} castShadow receiveShadow />

      {hovered && !panelOpen && (
        <Html
          center
          position={[0, 1.2, -0.1]}
          distanceFactor={7.5}
          style={{ pointerEvents: "none" }}
        >
          <aside
            className="vending-popover"
            aria-label="Informasi Soda Vending Machine"
          >
            Soda Vending Machine
          </aside>
        </Html>
      )}

      {selected && (
        <mesh
          name="KeypadHitbox"
          position={[...KEYPAD_HITBOX.position]}
          renderOrder={100}
          userData={{ interactive: "vending-keypad" }}
          onClick={handleKeypadClick}
          onPointerEnter={(event) => handleKeypadHover(event, true)}
          onPointerLeave={(event) => handleKeypadHover(event, false)}
        >
          <boxGeometry args={[...KEYPAD_HITBOX.size]} />
          <meshBasicMaterial
            transparent
            opacity={0}
            depthWrite={false}
            colorWrite={false}
          />
          {keypadHovered && (
            <Edges color="#ff3b30" lineWidth={2.5} />
          )}
        </mesh>
      )}

      {panelOpen && (
        <Html
          center
          position={[0, 0.13, -0.78]}
          distanceFactor={4}
          zIndexRange={[100, 0]}
          style={{ pointerEvents: "auto" }}
        >
          <form
            className="vending-panel"
            onSubmit={handleSubmit}
            onPointerDown={(event) => event.stopPropagation()}
            onClick={(event) => event.stopPropagation()}
          >
            <button
              className="vending-panel__close"
              type="button"
              onClick={onClosePanel}
              aria-label="Tutup panel vending machine"
            >
              ×
            </button>

            <p className="vending-panel__eyebrow">Soda machine</p>
            <h2>Pilih minuman</h2>
            <p className="vending-panel__description">
              Masukkan kode yang tertera di bawah minuman, misalnya B03.
            </p>

            <label htmlFor="vending-code">Kode minuman</label>
            <input
              id="vending-code"
              name="vending-code"
              type="text"
              value={code}
              onChange={(event) => {
                setCode(event.target.value);
                setMessage(null);
              }}
              placeholder="B03"
              maxLength={3}
              autoComplete="off"
              autoFocus
              required
            />

            <button className="vending-panel__submit" type="submit">
              Submit
            </button>

            {message && (
              <p className="vending-panel__message" role="status">
                {message}
              </p>
            )}
          </form>
        </Html>
      )}
    </group>
  );
}

useGLTF.preload(MODEL_PATH);
