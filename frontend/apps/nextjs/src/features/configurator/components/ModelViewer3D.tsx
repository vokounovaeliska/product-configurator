"use client"

import {
  Suspense,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type MutableRefObject,
} from "react"
import { Center, OrbitControls, useGLTF } from "@react-three/drei"
import { Canvas, useFrame, useThree } from "@react-three/fiber"
import { Move } from "lucide-react"
import { useTranslations } from "next-intl"
import * as THREE from "three"
import { Button } from "@workspace/ui/components/button"
import { cn } from "@workspace/ui/lib/utils"

import {
  useConfiguratorPreferences,
  usePatchConfiguratorPreferences,
} from "@/api/configuratorPreferencesQueries"
import type { CameraAnglesGetter } from "@/api/configuratorPreferencesTypes"
import { env } from "@/config/env"
import { getImageUrlForDisplay } from "@/utils/imageUrl"

import { getViewDirectionForPreset } from "../constants/defaultViewPreset"
import { EMBED_CAMERA_DISTANCE } from "../constants/embedCameraDistance"
import type { Model3dConfig } from "../types/model3dConfig"
import {
  addDebugVisualization,
  disposeDebugVisualization,
  logGlbTransformsOnLoad,
  logParametricNodeDebugInfo,
} from "../utils/parametricDebugHelpers"
import type {
  BaselineTransformFromGlb,
  ComponentTransform,
  DeltaTransformFromUserParams,
} from "../utils/parametricTransformPipeline"
import {
  areParamsAtDefaults,
  computeDeltaTransforms,
  computeResolvedDimensions,
  getParamKeysAffectingTransforms,
  logParametricState,
} from "../utils/parametricTransformPipeline"
import { disposeEdgesFromScene, regenerateEdgesFromScene } from "../utils/regenerateEdges"

const MAX_TEXTURE_SIZE = 1024

function nextPowerOf2(n: number): number {
  return Math.pow(2, Math.ceil(Math.log2(Math.max(1, n))))
}

/** Resizes texture to power-of-2 dimensions for better GPU compatibility. Returns original if already Po2. */
function resizeTextureToPowerOf2(tex: THREE.Texture): THREE.Texture {
  const img = tex.image as HTMLImageElement | undefined
  if (!img?.naturalWidth) return tex

  const w = img.naturalWidth
  const h = img.naturalHeight
  let pw = nextPowerOf2(w)
  let ph = nextPowerOf2(h)
  if (pw > MAX_TEXTURE_SIZE || ph > MAX_TEXTURE_SIZE) {
    const scale = MAX_TEXTURE_SIZE / Math.max(pw, ph)
    pw = Math.min(MAX_TEXTURE_SIZE, nextPowerOf2(Math.round(pw * scale)))
    ph = Math.min(MAX_TEXTURE_SIZE, nextPowerOf2(Math.round(ph * scale)))
  }
  if (pw === w && ph === h) return tex

  const canvas = document.createElement("canvas")
  canvas.width = pw
  canvas.height = ph
  const ctx = canvas.getContext("2d")
  if (!ctx) return tex

  ctx.drawImage(img, 0, 0, w, h, 0, 0, pw, ph)

  const newTex = new THREE.CanvasTexture(canvas)
  newTex.colorSpace = tex.colorSpace ?? THREE.SRGBColorSpace
  newTex.wrapS = tex.wrapS
  newTex.wrapT = tex.wrapT
  newTex.flipY = tex.flipY
  tex.dispose()
  return newTex
}

/** Camera position for snapshot capture – front-right-top product shot angle (scene units = m). */
const SNAPSHOT_CAMERA_POSITION = new THREE.Vector3(22, 18, 22)

/** Padding factor so the model is not flush against the frame edges. */
const SNAPSHOT_FIT_PADDING = 1.25

function computeSceneBoundingBox(scene: THREE.Scene): THREE.Box3 | null {
  const box = new THREE.Box3()
  scene.traverse((child: THREE.Object3D) => {
    if (child instanceof THREE.Mesh && child.geometry) {
      const geom = child.geometry as THREE.BufferGeometry
      geom.computeBoundingBox()
      const bbox = geom.boundingBox
      if (bbox) {
        const worldBox = bbox.clone().applyMatrix4(child.matrixWorld)
        box.union(worldBox)
      }
    }
  })
  return box.isEmpty() ? null : box
}

/** Syncs camera position when it changes (e.g. after zoom preferences are saved). R3F Canvas only uses camera prop on mount. */
function CameraPositionSync({ position }: { position: [number, number, number] }) {
  const camera = useThree((s) => s.camera)
  const prevRef = useRef(position)
  useEffect(() => {
    if (
      prevRef.current[0] !== position[0] ||
      prevRef.current[1] !== position[1] ||
      prevRef.current[2] !== position[2]
    ) {
      camera.position.set(position[0], position[1], position[2])
      camera.updateProjectionMatrix()
      prevRef.current = position
    }
  }, [camera, position])
  return null
}

const ZOOM_MIN_DEFAULT = 1
const ZOOM_MAX_DEFAULT = 10
const ZOOM_DEFAULT_DISTANCE = 2

const ZOOM_MIN_EMBED = EMBED_CAMERA_DISTANCE.min
const ZOOM_MAX_EMBED = EMBED_CAMERA_DISTANCE.max
/** Default zoom for embed when no preference saved – more zoomed in than configurator. */
const ZOOM_DEFAULT_EMBED = EMBED_CAMERA_DISTANCE.default

/**
 * Default direction from orbit target toward camera. Main configurator uses a slightly elevated
 * angle (Y=2) for a “looking down” product shot; embed uses a flatter angle so the model sits
 * nearer the vertical center of tall preview areas instead of hugging the top.
 */
const _VIEW_DIR_DEFAULT: [number, number, number] = [0, 2, 5]
/** Nearly level with the product so it sits near the vertical middle of the embed canvas. */
const _VIEW_DIR_EMBED: [number, number, number] = [0, 0.18, 5]
/** World-space Y shift (negative = model lower in frame) — pairs with flat _VIEW_DIR_EMBED. */
const EMBED_SCENE_VERTICAL_BIAS = -0.22

/**
 * Extra Y (scene units) for orbit target + model group so framing tracks embed viewport size.
 * Taller/shorter iframes and non–16:9 aspects otherwise leave the model visually high or low.
 */
function computeEmbedViewportYOffset(heightPx: number, widthPx: number): number {
  if (!Number.isFinite(heightPx) || !Number.isFinite(widthPx) || heightPx < 64 || widthPx < 64) {
    return 0
  }
  const heightRefPx = 360
  const aspectRef = 16 / 9
  const heightNorm = heightPx / heightRefPx
  const aspect = widthPx / heightPx
  // Taller canvas → nudge framing so the product stays visually centered
  const fromHeight = (heightNorm - 1) * -0.12
  const fromAspect = (aspect - aspectRef) * 0.05
  return fromHeight + fromAspect
}

export type Model3dEffect = {
  meshNode: string
  type: "scale" | "position" | "material"
  axis?: string
  multiplier?: number
  /** Param to subtract from value (e.g. LenY in (parent!height-LenY)/2). */
  subtractParam?: string
  /** Constant offset in cm (e.g. -1 inch → -2.54 in parent!width-LenX-1). */
  offsetCm?: number
}

export type { ComponentTransform } from "../utils/parametricTransformPipeline"
export { getAttributeValueFromConfig } from "../utils/parametricTransformPipeline"

/**
 * Flat background colors for the 3D scene (no gradients / geometry).
 * previewColor matches color — used for UI swatches.
 */
export const BACKGROUND_PRESETS = {
  white: { type: "color" as const, color: "#ffffff", previewColor: "#ffffff" },
  offWhite: { type: "color" as const, color: "#f7f7f8", previewColor: "#f7f7f8" },
  lightGray: { type: "color" as const, color: "#e8e8ec", previewColor: "#e8e8ec" },
  coolGray: { type: "color" as const, color: "#d1d5db", previewColor: "#d1d5db" },
  gray: { type: "color" as const, color: "#9ca3af", previewColor: "#9ca3af" },
  slate: { type: "color" as const, color: "#64748b", previewColor: "#64748b" },
  dark: { type: "color" as const, color: "#374151", previewColor: "#374151" },
  black: { type: "color" as const, color: "#0f172a", previewColor: "#0f172a" },
  warm: { type: "color" as const, color: "#f5e6d3", previewColor: "#f5e6d3" },
  sand: { type: "color" as const, color: "#ebe4d8", previewColor: "#ebe4d8" },
  cream: { type: "color" as const, color: "#faf8f5", previewColor: "#faf8f5" },
  softBlue: { type: "color" as const, color: "#e3edf7", previewColor: "#e3edf7" },
  softGreen: { type: "color" as const, color: "#e8f2ec", previewColor: "#e8f2ec" },
  softPeach: { type: "color" as const, color: "#faf0eb", previewColor: "#faf0eb" },
  softLavender: { type: "color" as const, color: "#f0ecf5", previewColor: "#f0ecf5" },
} as const

export type BackgroundPresetKey = keyof typeof BACKGROUND_PRESETS

const DEFAULT_BACKGROUND: BackgroundPresetKey = "white"

/** Maps removed gradient preset ids to a similar solid color so old saves still look reasonable. */
const LEGACY_BACKGROUND_PRESETS: Partial<Record<string, BackgroundPresetKey>> = {
  openSky: "softBlue",
  softSky: "softBlue",
  garden: "softGreen",
  goldenHour: "warm",
  overcast: "coolGray",
  terrace: "sand",
  coastal: "softBlue",
  floorWall: "sand",
}

export type BackgroundPresetResolved = (typeof BACKGROUND_PRESETS)[BackgroundPresetKey]

function getBackgroundConfig(preset: string | null | undefined): BackgroundPresetResolved {
  if (!preset) return BACKGROUND_PRESETS[DEFAULT_BACKGROUND]
  const mapped = LEGACY_BACKGROUND_PRESETS[preset]
  const key = (mapped ?? preset) as BackgroundPresetKey
  return BACKGROUND_PRESETS[key] ?? BACKGROUND_PRESETS[DEFAULT_BACKGROUND]
}

/** Sets the Three.js scene background (inside Canvas). */
function SceneBackground({ config }: { config: BackgroundPresetResolved }) {
  const { scene } = useThree()

  useLayoutEffect(() => {
    scene.background = new THREE.Color(config.color)
    return () => {
      scene.background = null
    }
  }, [scene, config])

  return null
}

type Props = {
  modelUrl: string
  /** For configurator: fetches/saves zoom to backend. For embed: use configuratorPreferencesFromServer. */
  productModelId?: string
  /** Zoom preferences from server (embed). When set, used for initial camera. */
  configuratorPreferencesFromServer?: {
    zoomDistanceDefault?: number | null
    zoomDistanceEmbed?: number | null
    backgroundPreset?: string | null
    cameraHorizontalAngleRad?: number | null
    cameraVerticalAngleRad?: number | null
  } | null
  /** Override camera distance (e.g. from preview settings slider). When set, syncs 3D view to this value. */
  cameraDistanceOverride?: number | null
  /** Override background preset (e.g. from preview settings dropdown). When set, updates 3D view live. */
  backgroundPresetOverride?: string | null
  /** Called when user zooms in 3D view (live updates for slider sync). */
  onCameraDistanceChange?: (distance: number) => void
  className?: string
  config?: Model3dConfig | null
  /** JSON string: attribute code → Model3dEffect[]. When set, used for scale/position (one-to-many). */
  model3dEffects?: string | null
  /** Controls initial camera framing. thumbnail = zoomed in for card preview. */
  zoomPreset?: "default" | "embed" | "thumbnail"
  /** When true, enables preserveDrawingBuffer so the canvas can be captured (e.g. for embed snapshot). */
  canCapture?: boolean
  /** Called when capture at fixed angle is available (embed only). */
  onCaptureReady?: (capture: () => Promise<string | null>) => void
  /** When false, disables zoom (scroll/pinch). Use for embed to apply configurator zoom without user control. */
  enableZoom?: boolean
  /**
   * When true, render raw GLB with no parametric transforms, no Center, no edge generation.
   * Use for debugging to match online GLB viewer. Enable via ?renderRawGlb=1 or NEXT_PUBLIC_RENDER_RAW_GLB.
   */
  renderRawGlb?: boolean
  /** Y offset for Center (scene units). Use on mobile embed to adjust model position in viewport. */
  centerOffsetY?: number
  /**
   * When set, assigns a function that reads current OrbitControls angles (radians).
   * Cleared on unmount. Used by preview settings to persist default camera view.
   */
  cameraAnglesGetterRef?: MutableRefObject<CameraAnglesGetter | null>
}

type OrbitControlsRef = React.ComponentRef<typeof OrbitControls>

/** Base model size in cm (SketchUp convention: 100 cm diameter for round tables). */
const BASE_PRUMER_CM = 100
const BASE_TLOUSTKA_CM = 4
/** Base dimensions for rectangular tables (width × depth × height). */
const BASE_WIDTH_CM = 100
const BASE_DEPTH_CM = 60
const BASE_HEIGHT_CM = 75

/**
 * Converts a dimension value to cm based on attribute unit.
 * Model scaling uses cm; attributes may be stored in mm, cm, m, or in.
 */
function toCm(value: number, unit: string | null | undefined): number {
  const u = (unit ?? "").trim().toLowerCase()
  switch (u) {
    case "mm":
      return value / 10
    case "cm":
      return value
    case "m":
      return value * 100
    case "in":
    case "inch":
    case "inches":
      return value * 2.54
    default:
      return value
  }
}

/**
 * Reference size in cm from parameters.json / DC defaults (if present).
 * Falls back to SketchUp-style constants when a key is missing so scale matches the exported mesh.
 */
function pickReferenceCm(
  parameterDefaults: Record<string, number> | null | undefined,
  keys: string[],
  fallbackCm: number,
): number {
  if (!parameterDefaults) return fallbackCm
  for (const key of keys) {
    for (const c of [key, key.toLowerCase(), key.toUpperCase()]) {
      const raw = parameterDefaults[c]
      if (typeof raw === "number" && Number.isFinite(raw) && raw > 0) {
        return raw
      }
    }
  }
  return fallbackCm
}

type MeshMatcher = string | RegExp

function nodeMatchesPattern(nodeName: string, pattern: MeshMatcher): boolean {
  const n = nodeName.trim()
  if (!n) return false
  if (pattern instanceof RegExp) {
    return pattern.test(n)
  }
  const lower = n.toLowerCase()
  const p = pattern.toLowerCase()
  return lower === p || lower.includes(p)
}

/** Patterns per logical part. RegExp = full regex test. */
const MESH_PATTERNS: Record<string, MeshMatcher[]> = {
  top: [/^top$/i, /top/i, /desk/i, /deska/i, /surface/i],
  /** Czech DC names: deska ≈ top for materials and scale targets. */
  deska: [/^deska$/i, /deska/i, /^top$/i, /top/i, /desk/i, /surface/i],
  bottom: [/^bottom$/i, /bottom/i, /podstavec/i, /platform/i, /base/i],
  legs: [/^legs?$/i, /^leg\d+$/i, /noh[ay]/i],
  /** noha / nohy ≈ leg for Czech models. */
  noha: [/^noha\d*$/i, /^nohy$/i, /^leg\d*$/i, /noh[ay]/i],
  nohy: [/^nohy$/i, /^noha\d*$/i, /^leg\d*$/i, /noh[ay]/i],
  leg: [/^leg\d*$/i, /^noha\d*$/i, /^nohy$/i, /noh[ay]/i],
  group: [/^group$/i, /^skupina$/i, /skupina/i, /group/i],
  headboard: [/^headboard$/i, /headboard/i, /opieradlo/i, /zadni/i],
  platform: [/^platform$/i, /platform/i, /plosina/i],
  uchytky: [/^uchytky$/i, /uchytky/i, /handles/i, /rukojet/i, /uchytka/i],
  komoda: [/^komoda$/i, /komoda/i],
}

function getPatternsForPart(label: string, code: string): MeshMatcher[] {
  const key = label.toLowerCase()
  return (
    MESH_PATTERNS[key] ?? [
      new RegExp(`^${escapeRegex(label)}$`, "i"),
      new RegExp(`^${escapeRegex(code)}$`, "i"),
      new RegExp(escapeRegex(label), "i"),
    ]
  )
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}

function findNodeByName(scene: THREE.Object3D, label: string, code: string): THREE.Object3D | null {
  const patterns = getPatternsForPart(label, code)
  for (const pattern of patterns) {
    let found: THREE.Object3D | null = null
    scene.traverse((obj: THREE.Object3D) => {
      if (!found && nodeMatchesPattern(obj.name, pattern)) {
        found = obj
      }
    })
    if (found) return found
  }
  return null
}

/** Finds all nodes matching label/code (e.g. leg1, leg2 via /^leg\d+$/). */
function findNodesByName(scene: THREE.Object3D, label: string, code: string): THREE.Object3D[] {
  const patterns = getPatternsForPart(label, code)
  const found: THREE.Object3D[] = []
  scene.traverse((obj: THREE.Object3D) => {
    for (const pattern of patterns) {
      if (nodeMatchesPattern(obj.name, pattern)) {
        found.push(obj)
        break
      }
    }
  })
  return found
}

function normalizeMaterialToken(value: string | null | undefined): string {
  return (value ?? "").trim().toLowerCase()
}

/** Loose match for SketchUp material ids vs API option values (e.g. _37#5 vs __37_5). */
function normalizeMaterialKeyLoose(value: string | null | undefined): string {
  return (value ?? "").toLowerCase().replace(/[^a-z0-9]+/g, "")
}

function findOptionByMaterialToken<T extends { label?: string; value?: string }>(
  options: T[],
  token: string,
): T | undefined {
  const normalizedToken = normalizeMaterialToken(token)
  if (!normalizedToken) return undefined
  const looseToken = normalizeMaterialKeyLoose(token)
  return options.find((option) => {
    const label = normalizeMaterialToken(option.label)
    const value = normalizeMaterialToken(option.value)
    if (label === normalizedToken || value === normalizedToken) return true
    if (!looseToken) return false
    const looseLabel = normalizeMaterialKeyLoose(option.label)
    const looseVal = normalizeMaterialKeyLoose(option.value)
    return looseLabel === looseToken || looseVal === looseToken
  })
}

/** Map Czech/English tabletop vs leg tokens to mesh pattern keys (top / legs). */
function normalizeMaterialTargetBase(base: string): string | null {
  const b = base.trim()
  if (!b) return null
  if (b.includes("deska") || b.includes("top")) return "top"
  if (b.includes("noha") || b.includes("nohy") || b.includes("leg")) return "legs"
  return b
}

function getColorTargetFromCode(code: string): string | null {
  const lower = code.toLowerCase()
  if (lower.startsWith("color_")) {
    return normalizeMaterialTargetBase(lower.slice(6)) ?? lower.slice(6)
  }
  if (lower.startsWith("barva_")) {
    return normalizeMaterialTargetBase(lower.slice(6)) ?? lower.slice(6)
  }
  if (lower.startsWith("material_")) {
    const rest = lower.slice(9)
    return normalizeMaterialTargetBase(rest) ?? rest
  }
  if (lower === "material" || lower === "barva") return "top"
  if (lower.endsWith("_color")) {
    const base = lower.slice(0, -6)
    return normalizeMaterialTargetBase(base) ?? (base.length > 0 ? base : null)
  }
  if (lower.endsWith("_barva")) {
    const base = lower.slice(0, -6)
    return normalizeMaterialTargetBase(base) ?? (base.length > 0 ? base : null)
  }
  if (lower.endsWith("_material")) {
    const base = lower.slice(0, -9)
    return normalizeMaterialTargetBase(base) ?? (base.length > 0 ? base : null)
  }
  return null
}

/** Lookup texture by URL; handles format mismatches (relative vs absolute, /api/v1 vs /api). */
function getTextureByUrl(
  map: Map<string, THREE.Texture> | undefined,
  url: string,
): THREE.Texture | undefined {
  if (!map) return undefined
  const direct = map.get(url)
  if (direct) return direct
  const fileIdMatch = /([a-f0-9-]{36}(?:\.[a-z]+)?)/i.exec(url)
  if (fileIdMatch?.[1]) {
    for (const [k, v] of map) {
      if (k.includes(fileIdMatch[1])) return v
    }
  }
  return undefined
}

const isLegMaterialDebugEnabled =
  process.env.NODE_ENV === "development" &&
  typeof window !== "undefined" &&
  new URLSearchParams(window.location.search).get("debugLegMaterial") === "1"

/**
 * Generates planar UV coordinates for geometry that lacks them.
 * Projects vertices onto the plane perpendicular to the axis with smallest extent
 * (e.g. for vertical legs: project onto XZ plane). Enables texture mapping on
 * SketchUp exports that omit UVs for some meshes.
 */
function computePlanarUvsForGeometry(geometry: THREE.BufferGeometry): void {
  const posAttr = geometry.attributes.position
  if (!posAttr || posAttr.count === 0) return

  geometry.computeBoundingBox()
  const box = geometry.boundingBox
  if (!box) return

  const min = box.min
  const max = box.max
  const dx = max.x - min.x
  const dy = max.y - min.y
  const dz = max.z - min.z
  const eps = 1e-6

  const uvs = new Float32Array(posAttr.count * 2)

  for (let i = 0; i < posAttr.count; i++) {
    const x = posAttr.getX(i)
    const y = posAttr.getY(i)
    const z = posAttr.getZ(i)

    if (dx <= dy && dx <= dz) {
      uvs[i * 2] = (z - min.z) / (dz > eps ? dz : 1)
      uvs[i * 2 + 1] = (y - min.y) / (dy > eps ? dy : 1)
    } else if (dy <= dx && dy <= dz) {
      uvs[i * 2] = (x - min.x) / (dx > eps ? dx : 1)
      uvs[i * 2 + 1] = (z - min.z) / (dz > eps ? dz : 1)
    } else {
      uvs[i * 2] = (x - min.x) / (dx > eps ? dx : 1)
      uvs[i * 2 + 1] = (y - min.y) / (dy > eps ? dy : 1)
    }
  }

  geometry.setAttribute("uv", new THREE.BufferAttribute(uvs, 2))
}

function logLegMaterialDebug(
  compName: string,
  nodeName: string,
  meshCount: number,
  details: { materialType?: string; hasMap?: boolean; hasUv?: boolean; needsUpdate?: boolean }[],
): void {
  if (!isLegMaterialDebugEnabled) return
  console.warn("[ModelViewer3D] Leg material debug:", {
    compName,
    nodeName,
    meshCount,
    meshDetails: details,
  })
}

function applyTextureToNode(
  node: THREE.Object3D,
  texture: THREE.Texture,
  debugCompName?: string,
): void {
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping
  texture.colorSpace = THREE.SRGBColorSpace
  texture.flipY = false
  texture.needsUpdate = true

  const applyToMaterial = (mat: THREE.Material): THREE.Material => {
    if ("map" in mat) {
      const m = mat as THREE.MeshStandardMaterial
      m.map = texture
      m.color.set(0xffffff)
      return mat
    }
    return new THREE.MeshStandardMaterial({
      map: texture,
      color: 0xffffff,
      roughness: 0.5,
      metalness: 0,
    })
  }

  const meshDetails: {
    materialType?: string
    hasMap?: boolean
    hasUv?: boolean
    needsUpdate?: boolean
  }[] = []

  node.traverse((child: THREE.Object3D) => {
    if (!(child instanceof THREE.Mesh) || !child.material) return

    const geom = child.geometry as THREE.BufferGeometry | undefined
    if (geom && !geom.attributes.uv) {
      computePlanarUvsForGeometry(geom)
    }
    const materials = Array.isArray(child.material) ? child.material : [child.material]
    const hasUv = Boolean(geom?.attributes?.uv)

    for (const mat of materials) {
      const stdMat = mat as THREE.MeshStandardMaterial
      meshDetails.push({
        materialType: stdMat.type,
        hasMap: "map" in stdMat && Boolean(stdMat.map),
        hasUv,
        needsUpdate: "needsUpdate" in stdMat,
      })
    }

    const userData = child.userData as Record<string, unknown>
    if (!userData._materialCloned) {
      if (Array.isArray(child.material)) {
        child.material = child.material.map((m) => applyToMaterial((m as THREE.Material).clone()))
      } else {
        child.material = applyToMaterial((child.material as THREE.Material).clone())
      }
      userData._materialCloned = true
    } else {
      if (Array.isArray(child.material)) {
        child.material.forEach((mat) => {
          if ("map" in mat) {
            ;(mat as THREE.MeshStandardMaterial).map = texture
            ;(mat as THREE.MeshStandardMaterial).color.set(0xffffff)
          }
        })
      } else {
        const m = child.material as THREE.MeshStandardMaterial
        if ("map" in m) {
          m.map = texture
          m.color.set(0xffffff)
        }
      }
    }
  })

  if (debugCompName && (debugCompName.toLowerCase().includes("leg") || isLegMaterialDebugEnabled)) {
    logLegMaterialDebug(debugCompName, node.name, meshDetails.length, meshDetails)
    if (isLegMaterialDebugEnabled && meshDetails.length === 0) {
      const hierarchy: { name: string; type: string; isMesh: boolean }[] = []
      node.traverse((obj: THREE.Object3D) => {
        const o = obj as THREE.Object3D & { type: string }
        hierarchy.push({
          name: obj.name || "(unnamed)",
          type: o.type ?? "Unknown",
          isMesh: obj instanceof THREE.Mesh,
        })
      })
      console.warn("[ModelViewer3D] Leg node has no meshes – full hierarchy:", hierarchy)
    }
  }
}

function captureBaselineTransforms(
  scene: THREE.Object3D,
  transforms: Record<string, ComponentTransform>,
): Record<string, BaselineTransformFromGlb> {
  const result: Record<string, BaselineTransformFromGlb> = {}
  for (const compName of Object.keys(transforms)) {
    const node = findNodeForEffect(scene, compName)
    if (!node) continue
    result[compName] = {
      position: [node.position.x, node.position.y, node.position.z],
      rotation: [node.rotation.x, node.rotation.y, node.rotation.z],
      scale: [node.scale.x, node.scale.y, node.scale.z],
      parentName: node.parent?.name ?? null,
    }
  }
  return result
}

function restoreNodeFromBaseline(node: THREE.Object3D, baseline: BaselineTransformFromGlb): void {
  node.position.set(baseline.position[0], baseline.position[1], baseline.position[2])
  node.rotation.set(baseline.rotation[0], baseline.rotation[1], baseline.rotation[2])
  node.scale.set(baseline.scale[0], baseline.scale[1], baseline.scale[2])
}

/**
 * Resolves material formula like "=parent!color_top" to the selected option's value/label.
 * Used for round tables and other models where material is driven by parent attribute.
 */
function resolveMaterialFormula(
  raw: string,
  config: Model3dConfig | null,
  parentName: string | null,
  allOptions: { label?: string; value?: string }[],
  _allSelectedOptions: { label?: string; value?: string }[],
): string | null {
  const trimmed = raw.trim()
  if (!trimmed?.startsWith("=")) return trimmed || null

  const match = /^parent!\s*([a-zA-Z_][a-zA-Z0-9_]*)$/i.exec(trimmed.slice(1).trim())
  const paramCode = match?.[1]
  if (!match || !paramCode || !config?.components?.length) return null

  const parentCompFromName = config.components.find(
    (c) =>
      c.label?.toLowerCase() === parentName?.toLowerCase() ||
      c.code?.toLowerCase() === parentName?.toLowerCase(),
  )
  const attrCodeLower = paramCode.toLowerCase()
  const attrsFromNamedParent = parentCompFromName
    ? (config.attributesByComponent[parentCompFromName.id] ?? [])
    : []
  const attrFromNamedParent = attrsFromNamedParent.find(
    (a) => a.code?.toLowerCase() === attrCodeLower,
  )
  const fallbackMatch = config.components
    .map((component) => ({
      componentId: component.id,
      attribute: (config.attributesByComponent[component.id] ?? []).find(
        (attribute) => attribute.code?.toLowerCase() === attrCodeLower,
      ),
    }))
    .find((entry) => entry.attribute != null)

  const targetComponentId = attrFromNamedParent
    ? parentCompFromName?.id
    : fallbackMatch?.attribute
      ? fallbackMatch.componentId
      : null
  const attr = attrFromNamedParent ?? fallbackMatch?.attribute ?? null
  if (!attr) return null

  const selected =
    targetComponentId != null
      ? config.selectedOptionsByComponent[targetComponentId]?.[attr.id]
      : null
  const opts = config.optionsByAttribute?.[attr.id] ?? allOptions
  const opt = selected ?? opts[0]
  // Prefer stable option value over localized label for material key matching.
  return opt?.value ?? opt?.label ?? null
}

function applyComponentTransformsToScene(
  scene: THREE.Object3D,
  transforms: Record<string, ComponentTransform>,
  config: Model3dConfig | null,
  parameterDefaults?: Record<string, number> | null,
  baselineTransforms?: Record<string, BaselineTransformFromGlb>,
  texturesByUrl?: Map<string, THREE.Texture>,
  materialsFromZip?: Record<string, { textureUrl?: string } | undefined>,
): void {
  const resolved = computeResolvedDimensions(transforms, config, parameterDefaults)
  const paramKeys = getParamKeysAffectingTransforms(transforms, parameterDefaults)
  const isAtDefaults = areParamsAtDefaults(config, parameterDefaults, paramKeys)

  const { selectedOptionsByComponent = {}, optionsByAttribute = {} } = config ?? {}
  const allSelectedOptions = Object.values(selectedOptionsByComponent).flatMap((m) =>
    Object.values(m).filter(Boolean),
  ) as { label?: string; value?: string; imageUrl?: string | null }[]
  const allOptions = (Object.values(optionsByAttribute ?? {}).flat() ?? []) as {
    label?: string
    value?: string
    imageUrl?: string | null
  }[]

  if (process.env.NODE_ENV === "development") {
    const deltas =
      !isAtDefaults && baselineTransforms
        ? computeDeltaTransforms(
            transforms,
            resolved,
            parameterDefaults ?? null,
            baselineTransforms,
            config,
          )
        : undefined
    logParametricState(resolved, paramKeys, isAtDefaults, config ?? null, parameterDefaults, deltas)
  }

  const notFound: string[] = []
  for (const [compName, t] of Object.entries(transforms)) {
    const node = findNodeForEffect(scene, compName)
    if (!node) {
      notFound.push(compName)
      continue
    }

    const baseline = baselineTransforms?.[compName]
    if (isAtDefaults && baseline) {
      restoreNodeFromBaseline(node, baseline)
    } else if (baseline) {
      const deltas = computeDeltaTransforms(
        transforms,
        resolved,
        parameterDefaults ?? null,
        baselineTransforms ?? {},
        config,
      )
      const delta = deltas[compName] as DeltaTransformFromUserParams | undefined
      if (delta) {
        node.position.set(
          baseline.position[0] + delta.position[0],
          baseline.position[1] + delta.position[1],
          baseline.position[2] + delta.position[2],
        )
        node.scale.set(
          baseline.scale[0] * delta.scale[0],
          baseline.scale[1] * delta.scale[1],
          baseline.scale[2] * delta.scale[2],
        )
      }
    }

    const rawMaterial = t.material
    if (typeof rawMaterial !== "string" || !rawMaterial) continue

    const material = resolveMaterialFormula(
      rawMaterial,
      config,
      (t._parent as string) ?? null,
      allOptions,
      allSelectedOptions,
    )
    if (!material) continue

    let targetNodes = findNodesByName(scene, compName, compName.toUpperCase())
    if (targetNodes.length === 0 && node) {
      targetNodes = [node]
    }
    const defaultOpt = findOptionByMaterialToken(allOptions, material)
    const opt = findOptionByMaterialToken(allSelectedOptions, material) ?? defaultOpt
    const textureUrl =
      opt?.imageUrl ??
      materialsFromZip?.[material]?.textureUrl ??
      materialsFromZip?.[material.toLowerCase()]?.textureUrl
    const texture = textureUrl && getTextureByUrl(texturesByUrl, textureUrl)

    if (
      isLegMaterialDebugEnabled &&
      (compName.toLowerCase().includes("leg") || compName === "top")
    ) {
      console.warn("[ModelViewer3D] Material application:", {
        compName,
        material,
        textureUrl: textureUrl ?? "(none)",
        hasTexture: Boolean(texture),
        targetNodeCount: targetNodes.length,
        targetNodeNames: targetNodes.map((n) => n.name),
      })
    }

    for (const n of targetNodes) {
      if (texture) {
        applyTextureToNode(n, texture, compName)
      }
    }
  }
  if (process.env.NODE_ENV === "development" && notFound.length > 0) {
    const allNames: string[] = []
    scene.traverse((obj) => {
      if (obj.name?.trim()) allNames.push(obj.name)
    })
    console.warn(
      "[ModelViewer3D] Nodes not found in GLB:",
      notFound.join(", "),
      "| Available:",
      allNames.slice(0, 25).join(", ") + (allNames.length > 25 ? "..." : ""),
    )
  }
}

function findNodeByExactName(scene: THREE.Object3D, name: string): THREE.Object3D | null {
  let found: THREE.Object3D | null = null
  scene.traverse((obj: THREE.Object3D) => {
    if (!found && obj.name.trim().toLowerCase() === name.trim().toLowerCase()) {
      found = obj
    }
  })
  return found
}

/** Root/group name aliases: parameters.json often uses "Skupina" but GLB export uses "Assembly-N". */
const ROOT_NODE_ALIASES: Record<string, string[]> = {
  skupina: ["assembly-6", "assembly-5", "assembly-4", "assembly", "group"],
  table: ["assembly-6", "assembly", "group"],
  stul: ["assembly-6", "assembly", "group", "table"],
  group: ["assembly-6", "assembly", "skupina"],
  top: ["deska", "desk", "tabletop"],
  deska: ["top", "desk", "tabletop"],
  leg: ["noha", "noha1", "noha2", "leg1", "leg2"],
  legs: ["noha", "noha1", "noha2", "leg", "leg1", "leg2"],
  noha: ["leg", "leg1", "leg2", "noha1", "noha2"],
  nohy: ["leg", "leg1", "leg2", "noha", "noha1", "noha2"],
}

/** SketchUp often adds #1, #2 to names. GLB export may use base name. Try variants. */
function findNodeForEffect(scene: THREE.Object3D, meshNode: string): THREE.Object3D | null {
  const n = meshNode.trim()
  if (!n) return null
  let node = findNodeByExactName(scene, n)
  if (node) return node
  const baseName = n.replace(/#\d+$/, "").trim()
  if (baseName !== n) {
    node = findNodeByExactName(scene, baseName)
    if (node) return node
  }
  const aliases = ROOT_NODE_ALIASES[baseName.toLowerCase()]
  if (aliases) {
    for (const alias of aliases) {
      node = findNodeByExactName(scene, alias)
      if (node) return node
    }
  }
  return findNodeByName(scene, n, baseName || n)
}

function applyConfigToScene(
  scene: THREE.Object3D,
  config: Model3dConfig | null,
  texturesByUrl?: Map<string, THREE.Texture>,
  model3dEffectsMap?: Record<string, Model3dEffect[]>,
  componentTransforms?: Record<string, ComponentTransform>,
  parameterDefaults?: Record<string, number> | null,
  baselineTransforms?: Record<string, BaselineTransformFromGlb>,
  materialsFromZip?: Record<string, { textureUrl?: string } | undefined>,
): void {
  const {
    components = [],
    attributesByComponent = {},
    selectedOptionsByComponent = {},
    selectedOtherValuesByComponent = {},
  } = config ?? {}

  const nodesToReset =
    componentTransforms != null
      ? new Set<string>()
      : model3dEffectsMap != null
        ? new Set(
            ([] as string[]).concat(
              ...Object.values(model3dEffectsMap).map((e) => e.map((x) => x.meshNode)),
            ),
          )
        : new Set<string>()

  for (const name of nodesToReset) {
    const n = findNodeForEffect(scene, name)
    if (n) {
      n.scale.set(1, 1, 1)
      n.position.set(0, 0, 0)
    }
  }

  const hasParametricTransforms =
    componentTransforms != null && Object.keys(componentTransforms).length > 0

  if (hasParametricTransforms) {
    if (process.env.NODE_ENV === "development") {
      console.warn(
        "[ModelViewer3D] Using componentTransforms path, keys:",
        Object.keys(componentTransforms),
      )
    }
    disposeDebugVisualization(scene, findNodeForEffect)
    applyComponentTransformsToScene(
      scene,
      componentTransforms,
      config,
      parameterDefaults,
      baselineTransforms,
      texturesByUrl,
      materialsFromZip,
    )
    // Edges regenerated after material loop below so final state is correct
  } else {
    disposeDebugVisualization(scene, findNodeForEffect)
  }

  for (const comp of components) {
    const attrs = attributesByComponent[comp.id] ?? []
    const selectedOptions = selectedOptionsByComponent[comp.id] ?? {}
    const otherValues = selectedOtherValuesByComponent[comp.id] ?? {}

    for (const attr of attrs) {
      const code = attr.code.toLowerCase()

      if (
        code.startsWith("color") ||
        code.startsWith("barva") ||
        code.startsWith("material") ||
        code.endsWith("_color") ||
        code.endsWith("_barva") ||
        code.endsWith("_material")
      ) {
        // When componentTransforms handles materials (e.g. Komponenta→color_top, legs→color_legs),
        // skip this loop to avoid double-application. model3dEffectsMap may map color_top→"table"
        // which can incorrectly color legs too if "table" is a parent of both.
        const hasComponentTransformsMaterials =
          componentTransforms != null &&
          Object.keys(componentTransforms).length > 0 &&
          Object.values(componentTransforms).some(
            (t) => typeof t?.material === "string" && t.material.trim().length > 0,
          )
        if (hasComponentTransformsMaterials) continue

        let targetNodes: THREE.Object3D[] = []

        if (model3dEffectsMap) {
          const codeNorm = attr.code.toUpperCase().replace(/[^A-Z0-9_]/g, "_")
          const effects =
            model3dEffectsMap[attr.code] ??
            model3dEffectsMap[attr.code.toUpperCase()] ??
            model3dEffectsMap[codeNorm] ??
            model3dEffectsMap[attr.code.toLowerCase()]
          const materialEffects = effects?.filter((e) => e.type === "material") ?? []
          for (const eff of materialEffects) {
            const node = findNodeForEffect(scene, eff.meshNode)
            if (node && !targetNodes.includes(node)) targetNodes.push(node)
          }
        }

        if (targetNodes.length === 0) {
          const targetName = getColorTargetFromCode(code)
          targetNodes = targetName
            ? findNodesByName(scene, targetName, targetName.toUpperCase())
            : ([findNodeByName(scene, comp.label, comp.code)].filter(Boolean) as THREE.Object3D[])
          if (targetNodes.length === 0 && targetName) {
            const fallback = findNodeForEffect(scene, targetName)
            if (fallback) targetNodes = [fallback]
          }
        }

        const opts = config?.optionsByAttribute?.[attr.id] ?? []
        const defaultOpt =
          opts.length > 0 ? [...opts].sort((a, b) => a.sortOrder - b.sortOrder)[0] : null
        const opt = selectedOptions[attr.id] ?? defaultOpt
        if (opt && targetNodes.length > 0) {
          const texture = opt.imageUrl && getTextureByUrl(texturesByUrl, opt.imageUrl)
          const debugName = getColorTargetFromCode(code) ?? attr.code
          for (const node of targetNodes) {
            if (texture) {
              applyTextureToNode(node, texture, debugName)
            }
          }
        }
      }
    }

    const diameterWithUnit = getNumericValueWithUnitFromCodes(attrs, otherValues, [
      "diameter_top",
      "diameter",
      "prumer",
    ])
    const thicknessWithUnit = getNumericValueWithUnitFromCodes(attrs, otherValues, [
      "thickness_top",
      "thickness_bottom",
      "top_thickness",
      "bottom_thickness",
      "thickness",
      "tloustka",
    ])
    const lengthWithUnit = getNumericValueWithUnitFromCodes(attrs, otherValues, [
      "length",
      "delka",
      "lenx",
    ])
    const widthWithUnit = getNumericValueWithUnitFromCodes(attrs, otherValues, [
      "width",
      "sirka",
      "lenz",
    ])
    const heightWithUnit = getNumericValueWithUnitFromCodes(attrs, otherValues, [
      "height",
      "vyska",
      "leny",
    ])

    const hasParametricTransforms =
      componentTransforms != null && Object.keys(componentTransforms).length > 0
    if (model3dEffectsMap && !hasParametricTransforms) {
      const appliedScale = new Set<string>()
      const appliedPosition = new Set<string>()
      const applyEffects = (effectType: "scale" | "position") => {
        for (const attr of attrs) {
          const effects = model3dEffectsMap[attr.code] ?? model3dEffectsMap[attr.code.toUpperCase()]
          if (!effects?.length) continue

          const valueWithUnit = getNumericValueWithUnit(attrs, otherValues, attr.code)
          if (!valueWithUnit || valueWithUnit.value <= 0) continue

          const valueCm = toCm(valueWithUnit.value, valueWithUnit.unit)
          const defaultNum =
            attr.type === "INTEGER"
              ? (attr.defaultInt ?? attr.minInt ?? 0)
              : (attr.defaultDecimal ?? attr.minDecimal ?? 0)
          const defaultCm =
            typeof defaultNum === "number" && defaultNum > 0
              ? toCm(defaultNum, attr.unit ?? valueWithUnit.unit)
              : 0

          for (const eff of effects) {
            if (eff.type !== effectType) continue
            const node = findNodeForEffect(scene, eff.meshNode)
            if (!node) continue

            const axis = (eff.axis ?? "x").toLowerCase()
            const key = `${eff.meshNode}:${axis}`

            if (eff.type === "scale") {
              if (appliedScale.has(key)) continue
              appliedScale.add(key)
              const fallbackBase =
                axis === "x" || axis === "xz"
                  ? pickReferenceCm(
                      parameterDefaults,
                      ["delka", "length", "lenx", "LenX"],
                      BASE_WIDTH_CM,
                    )
                  : axis === "y"
                    ? pickReferenceCm(
                        parameterDefaults,
                        ["vyska", "height", "leny", "LenY"],
                        BASE_HEIGHT_CM,
                      )
                    : pickReferenceCm(
                        parameterDefaults,
                        ["sirka", "width", "lenz", "LenZ", "depth"],
                        BASE_DEPTH_CM,
                      )
              const baseVal = defaultCm > 0 ? defaultCm : fallbackBase
              const s = Math.max(0.01, valueCm / baseVal)
              if (axis === "xz") {
                node.scale.x = s
                node.scale.z = s
              } else if (axis === "x") {
                node.scale.x = s
              } else if (axis === "y") {
                node.scale.y = s
              } else {
                node.scale.z = s
              }
            } else if (eff.type === "position") {
              if (appliedPosition.has(key)) continue
              appliedPosition.add(key)
              const mult = eff.multiplier ?? 1
              const subtractValueWithUnit = eff.subtractParam
                ? getNumericValueWithUnit(attrs, otherValues, eff.subtractParam)
                : null
              const subtractValueCm = subtractValueWithUnit
                ? toCm(subtractValueWithUnit.value, subtractValueWithUnit.unit)
                : 0
              const offsetCm = eff.offsetCm ?? 0
              const pos = ((valueCm - subtractValueCm) / 100) * mult + offsetCm / 100
              if (axis === "x") node.position.x = pos
              else if (axis === "y") node.position.y = pos
              else if (axis === "z") node.position.z = pos
            }
          }
        }
      }
      applyEffects("scale")
      applyEffects("position")
    }

    const hasRoundScale = diameterWithUnit != null || thicknessWithUnit != null
    const hasRectScale = lengthWithUnit != null || widthWithUnit != null || heightWithUnit != null
    const scaleTargetNode =
      hasRoundScale || hasRectScale
        ? (findNodeByName(scene, "top", "TOP") ?? findNodeByName(scene, comp.label, comp.code))
        : null

    if (scaleTargetNode && !model3dEffectsMap && !componentTransforms) {
      scaleTargetNode.scale.set(1, 1, 1)
      if (diameterWithUnit != null && (lengthWithUnit == null || widthWithUnit == null)) {
        // Round table: diameter → X,Z uniform, thickness → Y
        const diameterCm = toCm(diameterWithUnit.value, diameterWithUnit.unit)
        const thicknessCm =
          thicknessWithUnit != null && thicknessWithUnit.value > 0
            ? toCm(thicknessWithUnit.value, thicknessWithUnit.unit)
            : pickReferenceCm(
                parameterDefaults,
                ["tloustka", "thickness", "thickness_top", "top_thickness", "TLOUSTKA"],
                BASE_TLOUSTKA_CM,
              )
        const refPrumer = pickReferenceCm(
          parameterDefaults,
          ["diameter_top", "diameter", "prumer", "DIAMETER"],
          BASE_PRUMER_CM,
        )
        const refTloustka = pickReferenceCm(
          parameterDefaults,
          ["tloustka", "thickness", "thickness_top", "top_thickness", "TLOUSTKA"],
          BASE_TLOUSTKA_CM,
        )
        const diamScale = Math.max(0.01, diameterCm / refPrumer)
        const thickScale = Math.max(0.01, thicknessCm / refTloustka)
        scaleTargetNode.scale.set(diamScale, diamScale, thickScale)
      } else if (lengthWithUnit != null || widthWithUnit != null || heightWithUnit != null) {
        // Rectangular: length→X, width→Z, height→Y (reference cm from parameters.json when present)
        const refLenCm = pickReferenceCm(
          parameterDefaults,
          ["delka", "length", "lenx", "LenX"],
          BASE_WIDTH_CM,
        )
        const refWidCm = pickReferenceCm(
          parameterDefaults,
          ["sirka", "width", "lenz", "LenZ", "depth"],
          BASE_DEPTH_CM,
        )
        const refHgtCm = pickReferenceCm(
          parameterDefaults,
          ["vyska", "height", "leny", "LenY"],
          BASE_HEIGHT_CM,
        )
        const lengthCm = lengthWithUnit ? toCm(lengthWithUnit.value, lengthWithUnit.unit) : refLenCm
        const widthCm = widthWithUnit ? toCm(widthWithUnit.value, widthWithUnit.unit) : refWidCm
        const heightCm = heightWithUnit ? toCm(heightWithUnit.value, heightWithUnit.unit) : refHgtCm
        const scaleX = Math.max(0.01, lengthCm / refLenCm)
        const scaleZ = Math.max(0.01, widthCm / refWidCm)
        const scaleY = Math.max(0.01, heightCm / refHgtCm)
        scaleTargetNode.scale.set(scaleX, scaleY, scaleZ)
      } else if (thicknessWithUnit != null && thicknessWithUnit.value > 0) {
        const thicknessCm = toCm(thicknessWithUnit.value, thicknessWithUnit.unit)
        const refTl = pickReferenceCm(
          parameterDefaults,
          ["tloustka", "thickness", "thickness_top", "top_thickness", "TLOUSTKA"],
          BASE_TLOUSTKA_CM,
        )
        const thickScale = Math.max(0.01, thicknessCm / refTl)
        scaleTargetNode.scale.set(1, 1, thickScale)
      }
    }
  }

  if (hasParametricTransforms) {
    disposeEdgesFromScene(scene)
    scene.updateMatrixWorld(true)
    regenerateEdgesFromScene(scene)
    const isParametricDebugEnabled =
      process.env.NODE_ENV === "development" &&
      typeof window !== "undefined" &&
      new URLSearchParams(window.location.search).get("debugParametric") === "1"
    if (isParametricDebugEnabled) {
      logGlbTransformsOnLoad(scene, findNodeForEffect, "After applyComponentTransformsToScene")
      addDebugVisualization(scene, findNodeForEffect)
      logParametricNodeDebugInfo(scene, findNodeForEffect)
    }
  }
}

function getNumericValueWithUnit(
  attrs: {
    code: string
    id: string
    unit?: string | null
    defaultInt?: number | null
    defaultDecimal?: number | null
    minInt?: number | null
    minDecimal?: number | null
    type?: string
  }[],
  otherValues: Record<string, number | boolean>,
  code: string,
): { value: number; unit: string | null } | null {
  const attr = attrs.find((a) => a.code.toLowerCase() === code.toLowerCase())
  if (!attr) return null
  const v = otherValues[attr.id]
  const fallback =
    attr.type === "INTEGER"
      ? (attr.defaultInt ?? attr.minInt ?? 0)
      : (attr.defaultDecimal ?? attr.minDecimal ?? 0)
  const value = typeof v === "number" ? v : fallback
  return { value, unit: attr.unit ?? null }
}

/** Tries multiple attribute codes and returns the first found value. */
function getNumericValueWithUnitFromCodes(
  attrs: Parameters<typeof getNumericValueWithUnit>[0],
  otherValues: Record<string, number | boolean>,
  codes: string[],
): { value: number; unit: string | null } | null {
  for (const code of codes) {
    const result = getNumericValueWithUnit(attrs, otherValues, code)
    if (result != null && result.value > 0) return result
  }
  return null
}

function collectTextureUrls(
  config: Model3dConfig | null,
  componentTransforms?: Record<string, ComponentTransform>,
  materialsFromZip?: Record<string, { textureUrl?: string } | undefined>,
): string[] {
  const urls = new Set<string>()
  if (config) {
    for (const comp of config.components) {
      const selectedOptions = config.selectedOptionsByComponent[comp.id] ?? {}
      for (const opt of Object.values(selectedOptions)) {
        if (opt?.imageUrl) urls.add(opt.imageUrl)
      }
    }
  }
  if (componentTransforms && config) {
    const allOptions = Object.values(config.optionsByAttribute ?? {})
      .flat()
      .filter(Boolean)
    const allSelected = Object.values(config.selectedOptionsByComponent ?? {})
      .flatMap((m) => Object.values(m).filter(Boolean))
      .filter((o): o is NonNullable<typeof o> => o != null)
    for (const t of Object.values(componentTransforms)) {
      const raw = typeof t.material === "string" ? t.material : null
      if (!raw) continue
      const material = resolveMaterialFormula(
        raw,
        config,
        (t._parent as string) ?? null,
        allOptions,
        allSelected,
      )
      if (!material) continue
      const opt = findOptionByMaterialToken(allOptions, material)
      if (opt?.imageUrl) urls.add(opt.imageUrl)
    }
  }
  if (componentTransforms && materialsFromZip && config) {
    const allOptions = Object.values(config.optionsByAttribute ?? {})
      .flat()
      .filter(Boolean)
    const allSelected = Object.values(config.selectedOptionsByComponent ?? {})
      .flatMap((m) => Object.values(m).filter(Boolean))
      .filter((o): o is NonNullable<typeof o> => o != null)
    for (const t of Object.values(componentTransforms)) {
      const raw = typeof t.material === "string" ? t.material : null
      if (!raw) continue
      const material = resolveMaterialFormula(
        raw,
        config,
        (t._parent as string) ?? null,
        allOptions,
        allSelected,
      )
      if (!material) continue
      const mat = materialsFromZip[material] ?? materialsFromZip[material.toLowerCase()]
      const url = mat?.textureUrl
      if (url) urls.add(url)
    }
  } else if (componentTransforms && materialsFromZip) {
    const hasFormula = Object.values(componentTransforms).some(
      (t) => typeof t.material === "string" && t.material.startsWith("="),
    )
    if (hasFormula) {
      for (const mat of Object.values(materialsFromZip)) {
        if (mat?.textureUrl) urls.add(mat.textureUrl)
      }
    } else {
      for (const t of Object.values(componentTransforms)) {
        const material = typeof t.material === "string" ? t.material : null
        if (material) {
          const mat = materialsFromZip[material] ?? materialsFromZip[material.toLowerCase()]
          if (mat?.textureUrl) urls.add(mat.textureUrl)
        }
      }
    }
  }
  return [...urls]
}

function Model({
  url,
  config,
  model3dEffectsMap,
  componentTransforms,
  parameterDefaults,
  materialsFromZip,
  isRenderRawGlb,
}: {
  url: string
  config?: Model3dConfig | null
  model3dEffectsMap?: Record<string, Model3dEffect[]>
  componentTransforms?: Record<string, ComponentTransform>
  parameterDefaults?: Record<string, number> | null
  materialsFromZip?: Record<string, { textureUrl?: string } | undefined>
  isRenderRawGlb?: boolean
}) {
  const fullUrl = url.startsWith("http") ? url : `${env.NEXT_PUBLIC_REST_API_URL}${url}`
  const { scene: originalScene } = useGLTF(fullUrl)
  const { invalidate } = useThree()
  const texturesRef = useRef<THREE.Texture[]>([])
  const baselineTransformsRef = useRef<Record<string, BaselineTransformFromGlb>>({})

  const clonedScene = useMemo(() => {
    const scene = originalScene.clone(true)
    scene.traverse((obj) => {
      obj.visible = true
    })
    return scene
  }, [originalScene])

  useLayoutEffect(() => {
    if (componentTransforms && Object.keys(componentTransforms).length > 0) {
      baselineTransformsRef.current = captureBaselineTransforms(clonedScene, componentTransforms)
      if (process.env.NODE_ENV === "development") {
        logGlbTransformsOnLoad(
          clonedScene,
          findNodeForEffect,
          "GLB transforms on load (before any app transforms)",
        )
        console.warn("[ModelViewer3D] Baseline transforms captured:", baselineTransformsRef.current)
      }
    }
  }, [clonedScene, componentTransforms])

  useEffect(() => {
    if (isRenderRawGlb) return
    const hasConfig = config != null && config.components.length > 0
    const hasTransforms = componentTransforms != null && Object.keys(componentTransforms).length > 0
    if (process.env.NODE_ENV === "development") {
      console.warn("[ModelViewer3D] useEffect:", {
        hasConfig,
        hasTransforms,
        isRenderRawGlb,
        componentTransformsKeys: componentTransforms ? Object.keys(componentTransforms) : [],
        hasParameterDefaults:
          parameterDefaults != null && Object.keys(parameterDefaults ?? {}).length > 0,
      })
    }
    if (!hasConfig && !hasTransforms) return

    const textureUrls = collectTextureUrls(
      config ?? null,
      componentTransforms ?? undefined,
      materialsFromZip,
    )
    if (textureUrls.length === 0) {
      applyConfigToScene(
        clonedScene,
        config ?? null,
        undefined,
        model3dEffectsMap,
        componentTransforms,
        parameterDefaults,
        baselineTransformsRef.current,
        materialsFromZip,
      )
      invalidate()
      return
    }

    const loader = new THREE.TextureLoader()
    loader.setCrossOrigin("anonymous")
    const loads = textureUrls.map(
      (url) =>
        new Promise<[string, THREE.Texture]>((resolve, reject) => {
          const loadUrl = getImageUrlForDisplay(url) || url
          loader.load(
            loadUrl,
            (tex) => {
              const resized = resizeTextureToPowerOf2(tex)
              resolve([url, resized])
            },
            undefined,
            () => reject(new Error(`Failed to load texture: ${url}`)),
          )
        }),
    )

    let isCancelled = false
    void Promise.all(loads)
      .then((loaded) => {
        if (isCancelled) {
          loaded.forEach(([, tex]) => tex.dispose())
          return
        }
        texturesRef.current = loaded.map(([, t]) => t)
        const textureMap = new Map(loaded)
        applyConfigToScene(
          clonedScene,
          config ?? null,
          textureMap,
          model3dEffectsMap,
          componentTransforms,
          parameterDefaults,
          baselineTransformsRef.current,
          materialsFromZip,
        )
        invalidate()
      })
      .catch(() => {
        applyConfigToScene(
          clonedScene,
          config ?? null,
          undefined,
          model3dEffectsMap,
          componentTransforms,
          parameterDefaults,
          baselineTransformsRef.current,
          materialsFromZip,
        )
        invalidate()
      })

    return () => {
      isCancelled = true
      texturesRef.current.forEach((tex) => tex.dispose())
      texturesRef.current = []
    }
  }, [
    clonedScene,
    config,
    invalidate,
    model3dEffectsMap,
    componentTransforms,
    parameterDefaults,
    materialsFromZip,
    isRenderRawGlb,
  ])

  /* object, intensity, position are React Three Fiber / Three.js props */
  return (
    // eslint-disable-next-line react/no-unknown-property -- R3F primitive and light props
    <primitive object={clonedScene} />
  )
}

/** Cache key for Center recalculation when config changes (scale, materials). */
function getCenterCacheKey(config: Model3dConfig | null | undefined): string {
  if (!config) return "default"
  return JSON.stringify({
    o: config.selectedOptionsByComponent,
    v: config.selectedOtherValuesByComponent,
  })
}

function getSnapshotCameraDistance(
  zoomPreset: "default" | "embed" | "thumbnail",
  savedDistance?: number | null,
): number {
  if (zoomPreset === "thumbnail") return 10
  if (savedDistance != null) return savedDistance
  if (zoomPreset === "embed") return ZOOM_DEFAULT_EMBED
  return 12
}

function CameraAnglesGetterSync({
  controlsRef,
  getterRef,
}: {
  controlsRef: React.RefObject<OrbitControlsRef | null>
  getterRef: MutableRefObject<CameraAnglesGetter | null>
}) {
  useEffect(() => {
    getterRef.current = () => {
      const raw = controlsRef.current
      if (!raw) return null
      const ctrl = raw as unknown as {
        getAzimuthalAngle?: () => number
        getPolarAngle?: () => number
      }
      if (
        typeof ctrl.getAzimuthalAngle !== "function" ||
        typeof ctrl.getPolarAngle !== "function"
      ) {
        return null
      }
      return {
        cameraHorizontalAngleRad: ctrl.getAzimuthalAngle(),
        cameraVerticalAngleRad: ctrl.getPolarAngle(),
      }
    }
    return () => {
      getterRef.current = null
    }
  }, [controlsRef, getterRef])
  return null
}

function WebGLContextLossHandler({ onContextLost }: { onContextLost: () => void }) {
  const { gl } = useThree()
  useEffect(() => {
    const canvas = gl.domElement
    const handler = (e: Event) => {
      e.preventDefault()
      onContextLost()
    }
    canvas.addEventListener("webglcontextlost", handler)
    return () => canvas.removeEventListener("webglcontextlost", handler)
  }, [gl, onContextLost])
  return null
}

function SnapshotCaptureController({
  controlsRef,
  onCaptureReady,
  canCapture,
  zoomPreset,
  savedZoomDistance,
}: {
  controlsRef: React.RefObject<OrbitControlsRef | null>
  onCaptureReady?: (capture: () => Promise<string | null>) => void
  canCapture: boolean
  zoomPreset: "default" | "embed" | "thumbnail"
  savedZoomDistance?: number | null
}) {
  const { camera, gl, invalidate, scene } = useThree()
  const pendingResolveRef = useRef<((data: string | null) => void) | null>(null)
  const framesUntilCaptureRef = useRef(0)

  useLayoutEffect(() => {
    if (!onCaptureReady || !canCapture) return

    const capture = (): Promise<string | null> =>
      new Promise((resolve) => {
        const controls = controlsRef.current
        const savedPosition = camera.position.clone()
        const savedTarget = new THREE.Vector3(0, 0, 0)
        if (controls) savedTarget.copy(controls.target)
        const savedZoom = camera.zoom

        const baseDistance = getSnapshotCameraDistance(zoomPreset, savedZoomDistance)
        let targetCenter = new THREE.Vector3(0, 0, 0)
        let distance = baseDistance

        scene.updateMatrixWorld(true)
        const box = computeSceneBoundingBox(scene)
        if (box && !box.isEmpty()) {
          targetCenter = box.getCenter(new THREE.Vector3())
          const size = box.getSize(new THREE.Vector3())
          const maxDim = Math.max(size.x, size.y, size.z)
          if (camera instanceof THREE.PerspectiveCamera) {
            const fovRad = (camera.fov * Math.PI) / 180
            const minDistanceToFit = (maxDim * SNAPSHOT_FIT_PADDING) / (2 * Math.tan(fovRad / 2))
            distance = Math.max(minDistanceToFit, baseDistance)
          }
        }

        const dir = SNAPSHOT_CAMERA_POSITION.clone().normalize()
        camera.position.copy(targetCenter).add(dir.multiplyScalar(distance))
        camera.zoom = 1
        camera.lookAt(targetCenter)
        camera.updateProjectionMatrix()
        if (controls) {
          controls.target.copy(targetCenter)
          controls.update()
        }
        invalidate()

        pendingResolveRef.current = (data: string | null) => {
          camera.position.copy(savedPosition)
          camera.zoom = savedZoom
          camera.updateProjectionMatrix()
          if (controls) {
            controls.target.copy(savedTarget)
            controls.update()
          }
          invalidate()
          resolve(data)
        }
        framesUntilCaptureRef.current = 2
      })

    onCaptureReady(capture)
  }, [
    camera,
    controlsRef,
    invalidate,
    onCaptureReady,
    canCapture,
    zoomPreset,
    savedZoomDistance,
    scene,
  ])

  useFrame(() => {
    if (framesUntilCaptureRef.current > 0) {
      framesUntilCaptureRef.current -= 1
      return
    }
    const resolve = pendingResolveRef.current
    if (!resolve) return
    pendingResolveRef.current = null
    try {
      const data = gl.domElement.toDataURL("image/png")
      resolve(data)
    } catch {
      resolve(null)
    }
  })

  return null
}

function ZoomPersistence({
  controlsRef,
  zoomPreset,
  onSaveZoom,
  onDistanceChange,
}: {
  controlsRef: React.RefObject<OrbitControlsRef | null>
  zoomPreset: "default" | "embed" | "thumbnail"
  onSaveZoom?: (zoomPreset: "default" | "embed", distance: number) => void
  onDistanceChange?: (distance: number) => void
}) {
  const lastSavedRef = useRef<number | null>(null)
  const lastDistanceNotifyRef = useRef<number | null>(null)
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(
    () => () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current)
    },
    [],
  )

  useFrame(() => {
    if (zoomPreset === "thumbnail") return
    const controls = controlsRef.current
    if (!controls) return

    const distance = controls.getDistance()
    const minDist = zoomPreset === "embed" ? ZOOM_MIN_EMBED : ZOOM_MIN_DEFAULT
    const maxDist = zoomPreset === "embed" ? ZOOM_MAX_EMBED : ZOOM_MAX_DEFAULT
    const clamped = Math.max(minDist, Math.min(maxDist, distance))

    if (onDistanceChange) {
      const prev = lastDistanceNotifyRef.current
      if (prev == null || Math.abs(clamped - prev) > 1e-4) {
        lastDistanceNotifyRef.current = clamped
        onDistanceChange(clamped)
      }
    }

    if (!onSaveZoom) return
    if (lastSavedRef.current !== null && Math.abs(lastSavedRef.current - clamped) < 0.01) return

    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current)
    saveTimeoutRef.current = setTimeout(() => {
      onSaveZoom(zoomPreset, clamped)
      lastSavedRef.current = clamped
      saveTimeoutRef.current = null
    }, 150)
  })

  return null
}

/** Reusable vector for slider→camera sync to avoid per-frame allocations. */
const _directionForSliderSync = new THREE.Vector3()
const _directionForInitialSync = new THREE.Vector3()

/** Forces initial camera distance on first frame. OrbitControls can override Canvas camera on mount. */
function InitialZoomSync({
  controlsRef,
  zoomPreset,
  savedZoomDistance,
  centerOffsetY,
}: {
  controlsRef: React.RefObject<OrbitControlsRef | null>
  zoomPreset: "default" | "embed" | "thumbnail"
  savedZoomDistance?: number | null
  centerOffsetY?: number
}) {
  const hasSyncedRef = useRef(false)
  useFrame(() => {
    if (zoomPreset === "thumbnail" || hasSyncedRef.current) return
    const controls = controlsRef.current
    if (!controls) return

    hasSyncedRef.current = true
    const target = new THREE.Vector3(0, centerOffsetY ?? 0, 0)
    const defaultDistance = zoomPreset === "embed" ? ZOOM_DEFAULT_EMBED : ZOOM_DEFAULT_DISTANCE
    const distance = savedZoomDistance ?? defaultDistance
    const minDist = zoomPreset === "embed" ? ZOOM_MIN_EMBED : ZOOM_MIN_DEFAULT
    const maxDist = zoomPreset === "embed" ? ZOOM_MAX_EMBED : ZOOM_MAX_DEFAULT
    const clamped = Math.max(minDist, Math.min(maxDist, distance))

    controls.target.copy(target)
    const cam = controls.object
    _directionForInitialSync.subVectors(cam.position, target)
    const len = _directionForInitialSync.length()
    if (len < 1e-6) _directionForInitialSync.set(0, 0.37, 0.93)
    else _directionForInitialSync.normalize()
    cam.position.copy(target).addScaledVector(_directionForInitialSync, clamped)
    if (typeof controls.update === "function") controls.update()
  })
  return null
}

/** When embed viewport offset changes after mount, shift orbit target and camera together (preserves framing). */
function EmbedCenterYOffsetSync({
  controlsRef,
  centerOffsetY,
  modelUrl,
}: {
  controlsRef: React.RefObject<OrbitControlsRef | null>
  centerOffsetY: number
  modelUrl: string
}) {
  const prevYRef = useRef<number | undefined>(undefined)
  useEffect(() => {
    prevYRef.current = undefined
  }, [modelUrl])
  useFrame(() => {
    const controls = controlsRef.current
    if (!controls) return
    const y = centerOffsetY
    if (prevYRef.current === undefined) {
      prevYRef.current = y
      return
    }
    if (Math.abs(prevYRef.current - y) < 1e-5) return
    const dy = y - prevYRef.current
    prevYRef.current = y
    controls.target.y += dy
    controls.object.position.y += dy
    if (typeof controls.update === "function") controls.update()
  })
  return null
}

/** Syncs cameraDistanceOverride to OrbitControls when slider changes. */
function CameraDistanceOverrideSync({
  controlsRef,
  cameraDistanceOverride,
  zoomPreset,
}: {
  controlsRef: React.RefObject<OrbitControlsRef | null>
  cameraDistanceOverride: number | null | undefined
  zoomPreset: "default" | "embed" | "thumbnail"
}) {
  const prevOverrideRef = useRef<number | null | undefined>(undefined)

  useFrame(() => {
    if (zoomPreset === "thumbnail") return
    if (cameraDistanceOverride == null) {
      prevOverrideRef.current = undefined
      return
    }
    if (prevOverrideRef.current === cameraDistanceOverride) return
    prevOverrideRef.current = cameraDistanceOverride

    const controls = controlsRef.current
    if (!controls) return

    const minDist = zoomPreset === "embed" ? ZOOM_MIN_EMBED : ZOOM_MIN_DEFAULT
    const maxDist = zoomPreset === "embed" ? ZOOM_MAX_EMBED : ZOOM_MAX_DEFAULT
    const clamped = Math.max(minDist, Math.min(maxDist, cameraDistanceOverride))

    const cam = controls.object
    const target = controls.target
    _directionForSliderSync.subVectors(cam.position, target)
    const len = _directionForSliderSync.length()
    if (len < 1e-6) _directionForSliderSync.set(0, 0, 1)
    else _directionForSliderSync.normalize()
    cam.position.copy(target).addScaledVector(_directionForSliderSync, clamped)
    if (typeof controls.update === "function") controls.update()
  })

  return null
}

function SceneWithCapture({
  modelUrl,
  config,
  model3dEffectsMap,
  componentTransforms,
  parameterDefaults,
  materialsFromZip,
  canCapture,
  onCaptureReady,
  zoomPreset,
  isRenderRawGlb,
  onSaveZoom,
  cameraDistanceOverride,
  onCameraDistanceChange,
  savedZoomDistance,
  enableZoom: canZoom,
  centerOffsetY = 0,
  isEmbedInteractionLocked = false,
  cameraAnglesGetterRef,
}: {
  modelUrl: string
  config?: Model3dConfig | null
  model3dEffectsMap?: Record<string, Model3dEffect[]>
  componentTransforms?: Record<string, ComponentTransform>
  parameterDefaults?: Record<string, number> | null
  materialsFromZip?: Record<string, { textureUrl?: string } | undefined>
  canCapture: boolean
  onCaptureReady?: (capture: () => Promise<string | null>) => void
  zoomPreset: "default" | "embed" | "thumbnail"
  isRenderRawGlb?: boolean
  onSaveZoom?: (zoomPreset: "default" | "embed", distance: number) => void
  cameraDistanceOverride?: number | null
  onCameraDistanceChange?: (distance: number) => void
  savedZoomDistance?: number | null
  /** When false, disables zoom. When undefined, uses zoomPreset !== "thumbnail". */
  enableZoom?: boolean
  centerOffsetY?: number
  /** Embed: when true, orbit/zoom/pan disabled until user interacts (see parent overlay). */
  isEmbedInteractionLocked?: boolean
  cameraAnglesGetterRef?: MutableRefObject<CameraAnglesGetter | null>
}) {
  const controlsRef = useRef<OrbitControlsRef>(null)
  const shouldUseCenter = !isRenderRawGlb
  const isOrbitEnabled =
    zoomPreset !== "thumbnail" && !(zoomPreset === "embed" && isEmbedInteractionLocked)

  const model = (
    <Model
      url={modelUrl}
      config={config}
      model3dEffectsMap={model3dEffectsMap}
      componentTransforms={componentTransforms}
      parameterDefaults={parameterDefaults}
      materialsFromZip={materialsFromZip}
      isRenderRawGlb={isRenderRawGlb}
    />
  )

  return (
    <>
      {shouldUseCenter ? (
        /* eslint-disable-next-line react/no-unknown-property -- R3F/Three.js: position on group */
        <group position={[0, centerOffsetY, 0]}>
          <Center
            cacheKey={getCenterCacheKey(config)}
            precise
          >
            {model}
          </Center>
        </group>
      ) : (
        model
      )}
      <OrbitControls
        ref={controlsRef}
        enablePan={isOrbitEnabled}
        enableZoom={isOrbitEnabled && (canZoom ?? true)}
        enableRotate={isOrbitEnabled}
        {...(zoomPreset === "default" && {
          minDistance: ZOOM_MIN_DEFAULT,
          maxDistance: ZOOM_MAX_DEFAULT,
        })}
        {...(zoomPreset === "embed" && {
          minDistance: ZOOM_MIN_EMBED,
          maxDistance: ZOOM_MAX_EMBED,
        })}
        target={[0, centerOffsetY, 0]}
      />
      {cameraAnglesGetterRef != null && (
        <CameraAnglesGetterSync
          controlsRef={controlsRef}
          getterRef={cameraAnglesGetterRef}
        />
      )}
      <InitialZoomSync
        controlsRef={controlsRef}
        zoomPreset={zoomPreset}
        savedZoomDistance={savedZoomDistance}
        centerOffsetY={centerOffsetY}
      />
      {zoomPreset === "embed" && (
        <EmbedCenterYOffsetSync
          controlsRef={controlsRef}
          centerOffsetY={centerOffsetY}
          modelUrl={modelUrl}
        />
      )}
      {zoomPreset !== "thumbnail" && (
        <>
          <CameraDistanceOverrideSync
            controlsRef={controlsRef}
            cameraDistanceOverride={cameraDistanceOverride}
            zoomPreset={zoomPreset}
          />
          <ZoomPersistence
            controlsRef={controlsRef}
            zoomPreset={zoomPreset}
            onSaveZoom={onSaveZoom}
            onDistanceChange={onCameraDistanceChange}
          />
        </>
      )}
      {canCapture && onCaptureReady && (
        <SnapshotCaptureController
          controlsRef={controlsRef}
          onCaptureReady={onCaptureReady}
          canCapture={canCapture}
          zoomPreset={zoomPreset}
          savedZoomDistance={savedZoomDistance}
        />
      )}
    </>
  )
}

function getRenderRawGlb(isRenderRawGlbProp?: boolean): boolean {
  if (isRenderRawGlbProp === true) return true
  if (typeof window !== "undefined") {
    const q = new URLSearchParams(window.location.search)
    if (q.get("renderRawGlb") === "1" || q.get("renderRawGlb") === "true") return true
  }
  return (
    process.env.NEXT_PUBLIC_RENDER_RAW_GLB === "true" ||
    process.env.NEXT_PUBLIC_RENDER_RAW_GLB === "1"
  )
}

export const ModelViewer3D = ({
  modelUrl,
  productModelId,
  configuratorPreferencesFromServer,
  cameraDistanceOverride,
  backgroundPresetOverride,
  onCameraDistanceChange,
  className,
  config,
  model3dEffects,
  zoomPreset = "default",
  canCapture,
  onCaptureReady,
  renderRawGlb: isRenderRawGlbProp,
  enableZoom: canZoom,
  centerOffsetY,
  cameraAnglesGetterRef,
}: Props) => {
  const t = useTranslations("Configurator.preview")
  const [isContextLost, setIsContextLost] = useState(false)
  const [isEmbedInteractionUnlocked, setIsEmbedInteractionUnlocked] = useState(false)
  const handleContextLost = useCallback(() => setIsContextLost(true), [])
  const isEmbedInteractionLocked = zoomPreset === "embed" && !isEmbedInteractionUnlocked

  useEffect(() => {
    setIsEmbedInteractionUnlocked(false)
  }, [modelUrl])

  const containerRef = useRef<HTMLDivElement>(null)
  const [embedViewportSize, setEmbedViewportSize] = useState({ width: 0, height: 0 })

  useLayoutEffect(() => {
    if (zoomPreset !== "embed") {
      setEmbedViewportSize({ width: 0, height: 0 })
      return
    }
    const el = containerRef.current
    if (!el) return
    const ro = new ResizeObserver((entries) => {
      const cr = entries[0]?.contentRect
      if (!cr) return
      setEmbedViewportSize({ width: cr.width, height: cr.height })
    })
    ro.observe(el)
    setEmbedViewportSize({ width: el.clientWidth, height: el.clientHeight })
    return () => ro.disconnect()
  }, [zoomPreset, modelUrl])

  const resolvedCenterOffsetY = useMemo(() => {
    const base = centerOffsetY ?? 0
    if (zoomPreset !== "embed") return base
    return (
      base +
      EMBED_SCENE_VERTICAL_BIAS +
      computeEmbedViewportYOffset(embedViewportSize.height, embedViewportSize.width)
    )
  }, [zoomPreset, centerOffsetY, embedViewportSize.height, embedViewportSize.width])

  const isRenderRawGlb = getRenderRawGlb(isRenderRawGlbProp)
  const { model3dEffectsMap, componentTransforms, parameterDefaults, materialsFromZip } =
    useMemo(() => {
      if (!model3dEffects?.trim()) {
        return {
          model3dEffectsMap: undefined,
          componentTransforms: undefined,
          parameterDefaults: undefined,
          materialsFromZip: undefined,
        }
      }
      try {
        const parsed = JSON.parse(model3dEffects) as Record<string, unknown>
        const ct =
          parsed?.componentTransforms != null &&
          typeof parsed.componentTransforms === "object" &&
          !Array.isArray(parsed.componentTransforms)
            ? (parsed.componentTransforms as Record<string, ComponentTransform>)
            : undefined
        const effects =
          parsed?.effects != null && typeof parsed.effects === "object"
            ? (parsed.effects as Record<string, Model3dEffect[]>)
            : Array.isArray(parsed) || parsed?.componentTransforms != null
              ? undefined
              : (parsed as Record<string, Model3dEffect[]>)
        const pd =
          parsed?.parameterDefaults != null &&
          typeof parsed.parameterDefaults === "object" &&
          !Array.isArray(parsed.parameterDefaults)
            ? (parsed.parameterDefaults as Record<string, number>)
            : undefined
        const mats =
          parsed?.materials != null && typeof parsed.materials === "object"
            ? (parsed.materials as Record<string, { textureUrl?: string } | undefined>)
            : undefined
        if (process.env.NODE_ENV === "development") {
          console.warn("[ModelViewer3D] Parsed model_3d_effects:", {
            hasComponentTransforms: ct != null,
            componentTransformsKeys: ct ? Object.keys(ct) : [],
            parameterDefaultsKeys: pd ? Object.keys(pd) : [],
            parameterDefaultsSample: pd ? Object.fromEntries(Object.entries(pd).slice(0, 8)) : null,
            materialsFromZipKeys: mats ? Object.keys(mats) : [],
          })
        }
        return {
          model3dEffectsMap: effects,
          componentTransforms: ct,
          parameterDefaults: pd,
          materialsFromZip: mats,
        }
      } catch (e) {
        if (process.env.NODE_ENV === "development") {
          console.warn("[ModelViewer3D] Failed to parse model_3d_effects:", e)
        }
        return {
          model3dEffectsMap: undefined,
          componentTransforms: undefined,
          parameterDefaults: undefined,
          materialsFromZip: undefined,
        }
      }
    }, [model3dEffects])

  const { data: preferencesFromApi } = useConfiguratorPreferences(productModelId ?? "", {
    enabled: !configuratorPreferencesFromServer,
  })
  const patchPreferences = usePatchConfiguratorPreferences(productModelId ?? "")

  const backgroundConfig = useMemo(() => {
    const preset =
      backgroundPresetOverride ??
      configuratorPreferencesFromServer?.backgroundPreset ??
      preferencesFromApi?.backgroundPreset
    return getBackgroundConfig(preset)
  }, [
    backgroundPresetOverride,
    configuratorPreferencesFromServer?.backgroundPreset,
    preferencesFromApi?.backgroundPreset,
  ])

  const savedZoomDistance = useMemo(() => {
    const d =
      zoomPreset === "embed"
        ? (configuratorPreferencesFromServer?.zoomDistanceEmbed ??
          configuratorPreferencesFromServer?.zoomDistanceDefault ??
          preferencesFromApi?.zoomDistanceEmbed ??
          preferencesFromApi?.zoomDistanceDefault)
        : (configuratorPreferencesFromServer?.zoomDistanceDefault ??
          preferencesFromApi?.zoomDistanceDefault)
    if (zoomPreset === "embed") {
      if (d != null && d >= ZOOM_MIN_EMBED && d <= ZOOM_MAX_EMBED) return d
      return null
    }
    if (d != null && d >= ZOOM_MIN_DEFAULT && d <= ZOOM_MAX_DEFAULT) return d
    return null
  }, [
    zoomPreset,
    configuratorPreferencesFromServer?.zoomDistanceDefault,
    configuratorPreferencesFromServer?.zoomDistanceEmbed,
    preferencesFromApi?.zoomDistanceDefault,
    preferencesFromApi?.zoomDistanceEmbed,
  ])

  const onSaveZoom = useCallback(
    (_preset: "default" | "embed", distance: number) => {
      if (!productModelId) return
      patchPreferences.mutate({ zoomDistanceDefault: distance })
    },
    [productModelId, patchPreferences],
  )

  const shouldPersistZoom =
    Boolean(productModelId) && zoomPreset !== "thumbnail" && zoomPreset !== "embed"

  const savedCameraHorizontalAngleRad =
    preferencesFromApi?.cameraHorizontalAngleRad ??
    configuratorPreferencesFromServer?.cameraHorizontalAngleRad ??
    null
  const savedCameraVerticalAngleRad =
    preferencesFromApi?.cameraVerticalAngleRad ??
    configuratorPreferencesFromServer?.cameraVerticalAngleRad ??
    null

  const cameraPosition: [number, number, number] = useMemo(() => {
    const dirPreset =
      zoomPreset === "thumbnail" ? "default" : zoomPreset === "embed" ? "embed" : "default"
    let dir: THREE.Vector3
    if (
      savedCameraHorizontalAngleRad != null &&
      savedCameraVerticalAngleRad != null &&
      Number.isFinite(savedCameraHorizontalAngleRad) &&
      Number.isFinite(savedCameraVerticalAngleRad)
    ) {
      dir = new THREE.Vector3()
        .setFromSpherical(
          new THREE.Spherical(1, savedCameraVerticalAngleRad, savedCameraHorizontalAngleRad),
        )
        .normalize()
    } else {
      const [dx, dy, dz] = getViewDirectionForPreset("automatic", dirPreset)
      dir = new THREE.Vector3(dx, dy, dz).normalize()
    }
    const defaultDistance = zoomPreset === "embed" ? ZOOM_DEFAULT_EMBED : ZOOM_DEFAULT_DISTANCE
    const distance = savedZoomDistance ?? defaultDistance
    const targetY = resolvedCenterOffsetY
    const target = new THREE.Vector3(0, targetY, 0)
    return target.clone().add(dir.multiplyScalar(distance)).toArray() as [number, number, number]
  }, [
    zoomPreset,
    savedZoomDistance,
    resolvedCenterOffsetY,
    savedCameraHorizontalAngleRad,
    savedCameraVerticalAngleRad,
  ])

  if (isContextLost) {
    return (
      <div
        className={`relative flex min-h-[40vh] w-full flex-col items-center justify-center gap-4 rounded-lg border bg-muted/30 ${className ?? ""}`}
        style={{ touchAction: "none" }}
      >
        <p className="text-sm text-muted-foreground">{t("contextLost")}</p>
        <Button
          size="sm"
          variant="outline"
          onClick={() => setIsContextLost(false)}
        >
          {t("retry")}
        </Button>
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative h-full w-full",
        zoomPreset === "embed" ? "min-h-0" : "min-h-[40vh]",
        className,
      )}
      style={{ touchAction: "none" }}
    >
      <Canvas
        camera={{ position: cameraPosition, fov: 45 }}
        gl={{ antialias: true, preserveDrawingBuffer: canCapture ?? false }}
      >
        {/* eslint-disable react/no-unknown-property -- R3F/Three.js: attach, args, intensity, position */}
        <SceneBackground config={backgroundConfig} />
        <CameraPositionSync position={cameraPosition} />
        <WebGLContextLossHandler onContextLost={handleContextLost} />
        <ambientLight intensity={1.2} />
        <directionalLight
          position={[5, 8, 5]}
          intensity={1.5}
        />
        <directionalLight
          position={[-4, 4, -4]}
          intensity={0.6}
        />
        {/* eslint-enable react/no-unknown-property */}
        <Suspense fallback={null}>
          <SceneWithCapture
            modelUrl={modelUrl}
            config={config}
            model3dEffectsMap={model3dEffectsMap}
            componentTransforms={componentTransforms}
            parameterDefaults={parameterDefaults}
            materialsFromZip={materialsFromZip}
            canCapture={canCapture ?? false}
            onCaptureReady={onCaptureReady}
            zoomPreset={zoomPreset}
            isRenderRawGlb={isRenderRawGlb}
            onSaveZoom={shouldPersistZoom ? onSaveZoom : undefined}
            cameraDistanceOverride={cameraDistanceOverride}
            onCameraDistanceChange={onCameraDistanceChange}
            savedZoomDistance={savedZoomDistance}
            enableZoom={canZoom}
            centerOffsetY={resolvedCenterOffsetY}
            isEmbedInteractionLocked={isEmbedInteractionLocked}
            cameraAnglesGetterRef={cameraAnglesGetterRef}
          />
        </Suspense>
      </Canvas>
      {zoomPreset === "embed" && (
        <>
          <div
            className="pointer-events-none absolute top-3 right-3 z-[12] flex items-center justify-center rounded-md border border-border/80 bg-background/90 p-2 text-muted-foreground shadow-sm backdrop-blur-sm"
            role="img"
            aria-label={t("embedMoveHint")}
          >
            <Move
              className="size-4 shrink-0 opacity-90"
              aria-hidden
            />
          </div>
          {isEmbedInteractionLocked && (
            <button
              type="button"
              aria-label={t("embedClickToInteract")}
              className="absolute inset-0 z-[11] cursor-pointer touch-manipulation bg-transparent"
              onPointerDown={(e) => {
                e.preventDefault()
                setIsEmbedInteractionUnlocked(true)
              }}
              onWheel={(e) => {
                e.preventDefault()
                e.stopPropagation()
              }}
            />
          )}
        </>
      )}
    </div>
  )
}
