/**
 * Orbit camera distance for embedded iframe (same semantics as ModelViewer3D savedZoomDistance).
 * Lower = closer to the product; higher = farther (more zoomed out).
 * Range matches the main configurator zoom (1–10) plus headroom for wide products.
 */
export const EMBED_CAMERA_DISTANCE = {
  min: 1,
  max: 11,
  step: 0.5,
  /** When no preference is saved in DB — same ballpark as configurator default (2). */
  default: 2,
} as const
