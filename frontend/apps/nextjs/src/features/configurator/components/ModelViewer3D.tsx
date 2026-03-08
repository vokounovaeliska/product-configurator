"use client"

import { Suspense, useEffect, useLayoutEffect, useMemo, useRef } from "react"
import { Center, OrbitControls, useGLTF } from "@react-three/drei"
import { Canvas, useFrame, useThree } from "@react-three/fiber"
import * as THREE from "three"

import { env } from "@/config/env"
import { getImageUrl } from "@/utils/imageUrl"

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

/** Camera position for snapshot capture – front-right-top product shot angle (scene units = m). */
const SNAPSHOT_CAMERA_POSITION = new THREE.Vector3(22, 18, 22)

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

type Props = {
  modelUrl: string
  className?: string
  config?: Model3dConfig | null
  /** JSON string: attribute code → Model3dEffect[]. When set, used for scale/position (one-to-many). */
  model3dEffects?: string | null
  /** Controls initial camera framing (embed should start slightly zoomed out). */
  zoomPreset?: "default" | "embed"
  /** When true, enables preserveDrawingBuffer so the canvas can be captured (e.g. for embed snapshot). */
  canCapture?: boolean
  /** Called when capture at fixed angle is available (embed only). */
  onCaptureReady?: (capture: () => Promise<string | null>) => void
  /**
   * When true, render raw GLB with no parametric transforms, no Center, no edge generation.
   * Use for debugging to match online GLB viewer. Enable via ?renderRawGlb=1 or NEXT_PUBLIC_RENDER_RAW_GLB.
   */
  renderRawGlb?: boolean
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
  top: [/^top$/i, /top/i, /deska/i, /surface/i],
  bottom: [/^bottom$/i, /bottom/i, /podstavec/i, /platform/i, /base/i],
  legs: [/^legs?$/i, /^leg\d+$/i, /noh[ay]/i],
  group: [/^group$/i, /^skupina$/i, /skupina/i, /group/i],
  headboard: [/^headboard$/i, /headboard/i, /opieradlo/i, /zadni/i],
  platform: [/^platform$/i, /platform/i, /plosina/i],
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

function getColorTargetFromCode(code: string): string | null {
  const lower = code.toLowerCase()
  if (lower.startsWith("color_")) return lower.slice(6)
  if (lower.startsWith("barva_")) return lower.slice(6)
  if (lower.endsWith("_color")) return lower.slice(0, -6) // top_color → top
  return null
}

function applyTextureToNode(node: THREE.Object3D, texture: THREE.Texture): void {
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping
  node.traverse((child: THREE.Object3D) => {
    if (!(child instanceof THREE.Mesh) || !child.material) return
    const rawMat = (
      Array.isArray(child.material) ? child.material[0] : child.material
    ) as THREE.Material
    const mat = rawMat as THREE.MeshStandardMaterial
    if (!mat || !("map" in mat)) return

    const userData = child.userData as Record<string, unknown>
    if (!userData._materialCloned) {
      child.material = mat.clone()
      userData._materialCloned = true
    }
    const m = child.material as THREE.MeshStandardMaterial
    m.map = texture
    m.color.set(0xffffff)
  })
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

    const material = t.material
    if (typeof material === "string" && material) {
      const targetNodes = findNodesByName(scene, compName, compName.toUpperCase())
      const defaultOpt = allOptions.find((o) => o.label?.toLowerCase() === material.toLowerCase())
      const opt =
        allSelectedOptions.find((o) => o?.label?.toLowerCase() === material.toLowerCase()) ??
        defaultOpt
      const textureUrl =
        opt?.imageUrl ??
        materialsFromZip?.[material]?.textureUrl ??
        materialsFromZip?.[material.toLowerCase()]?.textureUrl
      const texture = textureUrl && texturesByUrl?.get(textureUrl)
      for (const n of targetNodes) {
        if (texture) {
          applyTextureToNode(n, texture)
        }
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
  group: ["assembly-6", "assembly", "skupina"],
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

      if (code.startsWith("color") || code.startsWith("barva") || code.endsWith("_color")) {
        const targetName = getColorTargetFromCode(code)
        const targetNodes = targetName
          ? findNodesByName(scene, targetName, targetName.toUpperCase())
          : ([findNodeByName(scene, comp.label, comp.code)].filter(Boolean) as THREE.Object3D[])
        const opts = config?.optionsByAttribute?.[attr.id] ?? []
        const defaultOpt =
          opts.length > 0 ? [...opts].sort((a, b) => a.sortOrder - b.sortOrder)[0] : null
        const opt = selectedOptions[attr.id] ?? defaultOpt
        if (opt && targetNodes.length > 0) {
          const texture = opt.imageUrl && texturesByUrl?.get(opt.imageUrl)
          for (const node of targetNodes) {
            if (texture) {
              applyTextureToNode(node, texture)
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
    const widthWithUnit = getNumericValueWithUnitFromCodes(attrs, otherValues, [
      "width",
      "sirka",
      "lenx",
    ])
    const depthWithUnit = getNumericValueWithUnitFromCodes(attrs, otherValues, [
      "depth",
      "hloubka",
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
                  ? BASE_WIDTH_CM
                  : axis === "y"
                    ? BASE_HEIGHT_CM
                    : BASE_DEPTH_CM
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
    const hasRectScale = widthWithUnit != null || depthWithUnit != null || heightWithUnit != null
    const scaleTargetNode =
      hasRoundScale || hasRectScale
        ? (findNodeByName(scene, "top", "TOP") ?? findNodeByName(scene, comp.label, comp.code))
        : null

    if (scaleTargetNode && !model3dEffectsMap && !componentTransforms) {
      scaleTargetNode.scale.set(1, 1, 1)
      if (diameterWithUnit != null && (widthWithUnit == null || depthWithUnit == null)) {
        // Round table: diameter → X,Z uniform, thickness → Y
        const diameterCm = toCm(diameterWithUnit.value, diameterWithUnit.unit)
        const thicknessCm =
          thicknessWithUnit != null && thicknessWithUnit.value > 0
            ? toCm(thicknessWithUnit.value, thicknessWithUnit.unit)
            : BASE_TLOUSTKA_CM
        const diamScale = Math.max(0.01, diameterCm / BASE_PRUMER_CM)
        const thickScale = Math.max(0.01, thicknessCm / BASE_TLOUSTKA_CM)
        scaleTargetNode.scale.set(diamScale, diamScale, thickScale)
      } else if (widthWithUnit != null || depthWithUnit != null || heightWithUnit != null) {
        // Rectangular: width→X, depth→Z, height→Y
        const widthCm = widthWithUnit
          ? toCm(widthWithUnit.value, widthWithUnit.unit)
          : BASE_WIDTH_CM
        const depthCm = depthWithUnit
          ? toCm(depthWithUnit.value, depthWithUnit.unit)
          : BASE_DEPTH_CM
        const heightCm = heightWithUnit
          ? toCm(heightWithUnit.value, heightWithUnit.unit)
          : BASE_HEIGHT_CM
        const scaleX = Math.max(0.01, widthCm / BASE_WIDTH_CM)
        const scaleZ = Math.max(0.01, depthCm / BASE_DEPTH_CM)
        const scaleY = Math.max(0.01, heightCm / BASE_HEIGHT_CM)
        scaleTargetNode.scale.set(scaleX, scaleY, scaleZ)
      } else if (thicknessWithUnit != null && thicknessWithUnit.value > 0) {
        const thicknessCm = toCm(thicknessWithUnit.value, thicknessWithUnit.unit)
        const thickScale = Math.max(0.01, thicknessCm / BASE_TLOUSTKA_CM)
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
  if (componentTransforms && config?.optionsByAttribute) {
    const allOptions = Object.values(config.optionsByAttribute).flat()
    for (const t of Object.values(componentTransforms)) {
      const material = typeof t.material === "string" ? t.material : null
      if (material) {
        const opt = allOptions.find((o) => o.label?.toLowerCase() === material.toLowerCase())
        if (opt?.imageUrl) urls.add(opt.imageUrl)
      }
    }
  }
  if (componentTransforms && materialsFromZip) {
    for (const t of Object.values(componentTransforms)) {
      const material = typeof t.material === "string" ? t.material : null
      if (material) {
        const mat = materialsFromZip[material] ?? materialsFromZip[material.toLowerCase()]
        const url = mat?.textureUrl
        if (url) urls.add(url)
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
          const fullUrl = getImageUrl(url)
          loader.load(
            fullUrl,
            (tex) => resolve([url, tex]),
            undefined,
            () => reject(new Error(`Failed to load texture: ${url}`)),
          )
        }),
    )

    let isCancelled = false
    Promise.all(loads)
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

function getSnapshotCameraDistance(zoomPreset: "default" | "embed"): number {
  return zoomPreset === "embed" ? 14 : 12
}

function WebGLContextLossHandler() {
  const { gl } = useThree()
  useEffect(() => {
    const canvas = gl.domElement
    const onContextLost = (e: Event) => {
      e.preventDefault()
      console.warn("[ModelViewer3D] WebGL context lost. Refresh the page to restore 3D view.")
    }
    canvas.addEventListener("webglcontextlost", onContextLost)
    return () => canvas.removeEventListener("webglcontextlost", onContextLost)
  }, [gl])
  return null
}

function SnapshotCaptureController({
  controlsRef,
  onCaptureReady,
  canCapture,
  zoomPreset,
}: {
  controlsRef: React.RefObject<OrbitControlsRef | null>
  onCaptureReady?: (capture: () => Promise<string | null>) => void
  canCapture: boolean
  zoomPreset: "default" | "embed"
}) {
  const { camera, gl, invalidate } = useThree()
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

        const dir = SNAPSHOT_CAMERA_POSITION.clone().normalize()
        camera.position.copy(dir.multiplyScalar(getSnapshotCameraDistance(zoomPreset)))
        camera.zoom = 1
        camera.lookAt(0, 0, 0)
        camera.updateProjectionMatrix()
        if (controls) {
          controls.target.set(0, 0, 0)
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
  }, [camera, controlsRef, invalidate, onCaptureReady, canCapture, zoomPreset])

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
}: {
  modelUrl: string
  config?: Model3dConfig | null
  model3dEffectsMap?: Record<string, Model3dEffect[]>
  componentTransforms?: Record<string, ComponentTransform>
  parameterDefaults?: Record<string, number> | null
  materialsFromZip?: Record<string, { textureUrl?: string } | undefined>
  canCapture: boolean
  onCaptureReady?: (capture: () => Promise<string | null>) => void
  zoomPreset: "default" | "embed"
  isRenderRawGlb?: boolean
}) {
  const controlsRef = useRef<OrbitControlsRef>(null)
  const shouldUseCenter =
    !isRenderRawGlb &&
    !(componentTransforms != null && Object.keys(componentTransforms ?? {}).length > 0)

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
        <Center
          cacheKey={getCenterCacheKey(config)}
          precise
        >
          {model}
        </Center>
      ) : (
        model
      )}
      <OrbitControls
        ref={controlsRef}
        enablePan
        enableZoom
        enableRotate
        target={[0, 0, 0]}
      />
      {canCapture && onCaptureReady && (
        <SnapshotCaptureController
          controlsRef={controlsRef}
          onCaptureReady={onCaptureReady}
          canCapture={canCapture}
          zoomPreset={zoomPreset}
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
  className,
  config,
  model3dEffects,
  zoomPreset = "default",
  canCapture,
  onCaptureReady,
  renderRawGlb: isRenderRawGlbProp,
}: Props) => {
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
  const cameraPosition: [number, number, number] = zoomPreset === "embed" ? [4, 6, 4] : [3, 6, 3]

  return (
    <div
      className={`relative h-full min-h-[40vh] w-full ${className ?? ""}`}
      style={{ touchAction: "none" }}
    >
      <Canvas
        camera={{ position: cameraPosition, fov: 45 }}
        gl={{ antialias: true, preserveDrawingBuffer: canCapture ?? false }}
      >
        <WebGLContextLossHandler />
        {/* eslint-disable react/no-unknown-property -- R3F/Three.js uses object, intensity, position etc. */}
        <ambientLight intensity={0.8} />
        <directionalLight
          position={[5, 5, 5]}
          intensity={1}
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
          />
        </Suspense>
      </Canvas>
    </div>
  )
}
