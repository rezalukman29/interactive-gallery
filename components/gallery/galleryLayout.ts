// World units are treated as metres. Keep the room and camera home in sync.
export const GALLERY_ROOM = {
  width: 10,
  height: 5.8,
  depth: 16,
  wallThickness: 0.2,
  skylightWidth: 3.6,
} as const;

export const HOME_POSITION = [0, 2.7, 6.5] as const;
export const HOME_LOOK_AT = [0, 2.65, -7.86] as const;
