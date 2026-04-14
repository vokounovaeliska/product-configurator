import * as THREE from "three"

/** Named view shortcuts; API now prefers saved orbit radians. "automatic" = legacy framing. */
export const DEFAULT_VIEW_PRESET_IDS = [
  "automatic",
  "front",
  "left",
  "right",
  "back",
  "front_left",
  "front_right",
  "isometric",
] as const

export type DefaultViewPresetId = (typeof DEFAULT_VIEW_PRESET_IDS)[number]

/** Base view direction before preset rotation (same as ModelViewer3D VIEW_DIR_*). */
const VIEW_DIR_DEFAULT: [number, number, number] = [0, 2, 5]
const VIEW_DIR_EMBED: [number, number, number] = [0, 0.18, 5]

const _sph = new THREE.Spherical()
const _vec = new THREE.Vector3()

/**
 * Unit direction from orbit target toward camera for the given preset.
 * "automatic" uses the legacy app default (slight 3/4 for configurator, flatter for embed).
 */
export function getViewDirectionForPreset(
  preset: string | null | undefined,
  zoomPreset: "default" | "embed" | "thumbnail",
): [number, number, number] {
  const rawBase = zoomPreset === "embed" ? VIEW_DIR_EMBED : VIEW_DIR_DEFAULT
  const base = _vec.set(rawBase[0], rawBase[1], rawBase[2]).normalize()
  const pid = (preset ?? "automatic").toLowerCase()

  if (pid === "automatic" || pid === "") {
    return [base.x, base.y, base.z]
  }

  if (pid === "isometric") {
    _sph.set(1, THREE.MathUtils.degToRad(52), THREE.MathUtils.degToRad(42))
    const v = new THREE.Vector3().setFromSpherical(_sph)
    return [v.x, v.y, v.z]
  }

  _sph.setFromVector3(base)
  const yawAdd: Record<string, number> = {
    front: 0,
    left: Math.PI / 2,
    right: -Math.PI / 2,
    back: Math.PI,
    front_left: Math.PI / 4,
    front_right: -Math.PI / 4,
  }
  const dTheta = yawAdd[pid] ?? 0
  _sph.theta += dTheta
  _sph.phi = Math.max(0.08, Math.min(Math.PI - 0.08, _sph.phi))
  const out = new THREE.Vector3().setFromSpherical(_sph)
  return [out.x, out.y, out.z]
}
