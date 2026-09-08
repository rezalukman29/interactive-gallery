import { useThree } from "@react-three/fiber";
import { gsap } from "gsap";
import { useEffect } from "react";
import { PerspectiveCamera, Vector3 } from "three";
import type { GalleryFocusTarget } from "./GalleryScene";

const HOME_POSITION = [0, 2.4, 6.5] as const;
const HOME_LOOK_AT = [0, 2.4, -4.86] as const;
const ANIMATION_DURATION = 1.2;

type CameraControllerProps = {
  selectedTarget: GalleryFocusTarget | null;
};

export function CameraController({
  selectedTarget,
}: CameraControllerProps) {
  const camera = useThree((state) => state.camera);
  const invalidate = useThree((state) => state.invalidate);

  useEffect(() => {
    if (!(camera instanceof PerspectiveCamera)) return;

    const direction = camera.getWorldDirection(new Vector3());
    const lookAt = camera.position
      .clone()
      .add(direction.multiplyScalar(10));
    const destination = selectedTarget?.cameraTarget ?? HOME_POSITION;
    const focus = selectedTarget?.position ?? HOME_LOOK_AT;

    const updateCamera = () => {
      camera.lookAt(lookAt);
      camera.updateProjectionMatrix();
      invalidate();
    };

    const timeline = gsap.timeline({
      defaults: {
        duration: ANIMATION_DURATION,
        ease: "power2.inOut",
      },
      onUpdate: updateCamera,
      onComplete: updateCamera,
    });

    timeline
      .to(
        camera.position,
        {
          x: destination[0],
          y: destination[1],
          z: destination[2],
        },
        0,
      )
      .to(
        lookAt,
        {
          x: focus[0],
          y: focus[1],
          z: focus[2],
        },
        0,
      );

    return () => {
      timeline.kill();
    };
  }, [camera, invalidate, selectedTarget]);

  return null;
}
