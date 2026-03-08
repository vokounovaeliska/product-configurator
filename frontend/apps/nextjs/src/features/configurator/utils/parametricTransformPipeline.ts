/**
 * Parametric transform pipeline for SketchUp-derived GLB models.
 * Resolves formulas (parent!width, LenX, etc.) and computes position/scale deltas.
 * Uses identity axis mapping: SketchUp Z-up (X=width, Y=depth, Z=height).
 */

import type { Model3dConfig } from "../types/model3dConfig"

/** GLB/glTF uses meters; SketchUp parameters use cm. 1 cm = 0.01 m. */
const CM_TO_M = 0.01
const M_TO_CM = 100

/** Convert cm to GLB scene units (meters). */
export function cmToGlbUnits(cm: number): number {
  return cm * CM_TO_M
}

/** Convert GLB scene units (meters) to cm. */
export function glbUnitsToCm(glbUnits: number): number {
  return glbUnits * M_TO_CM
}

/** Component transform from parameters.json: x, y, z, lenx, leny, lenz, width, height, depth, material, _parent. */
export type ComponentTransform = Record<string, string | number | null | undefined>

/** Base dimensions (width × depth × height in cm). */
export type BaseDimensions = {
  width: number
  height: number
  depth: number
}

/** Target transform for a node: position and scale in GLB units. */
export type NodeTargetTransform = {
  position: [number, number, number]
  scale: [number, number, number]
  rotation?: [number, number, number]
}

/** Baseline transform captured from GLB on load (before any app transforms). */
export type BaselineTransformFromGlb = {
  position: [number, number, number]
  rotation: [number, number, number]
  scale: [number, number, number]
  parentName: string | null
}

/** Delta transform from user params (add to baseline position, multiply baseline scale). */
export type DeltaTransformFromUserParams = {
  position: [number, number, number]
  scale: [number, number, number]
}

/** Identity axis mapping: SketchUp Z-up (X=width, Y=depth, Z=height). */
export type AxisMapping = "x" | "y" | "z"

/** Maps JSON axis string to scene axis (identity). */
export function mapJsonAxisToSceneAxis(axis: string): AxisMapping {
  const a = axis.trim().toLowerCase()
  if (a === "x" || a === "y" || a === "z") return a
  return "x"
}

/** Converts position in cm (JSON) to GLB units (meters). */
export function mapJsonPositionToGlbUnits(
  xCm: number,
  yCm: number,
  zCm: number,
): [number, number, number] {
  return [cmToGlbUnits(xCm), cmToGlbUnits(yCm), cmToGlbUnits(zCm)]
}

/** Resolved dimensions for a component (after formula evaluation). */
type ResolvedComponentDimensions = {
  x: number
  y: number
  z: number
  lenx: number
  leny: number
  lenz: number
  width?: number
  height?: number
  depth?: number
}

/** Resolved dimensions per component name. */
export type ResolvedDimensions = Record<string, ResolvedComponentDimensions>

/** Returns true if component has only width/height/depth (no lenx/leny/lenz). Skips for transform application. */
export function isGroupContainer(transform: ComponentTransform): boolean {
  const hasLenx = "lenx" in transform && transform.lenx != null
  const hasLeny = "leny" in transform && transform.leny != null
  const hasLenz = "lenz" in transform && transform.lenz != null
  const hasLenDimensions = hasLenx || hasLeny || hasLenz
  const hasWidthHeightDepth =
    ("width" in transform || "height" in transform || "depth" in transform) &&
    (transform.width != null || transform.height != null || transform.depth != null)
  return hasWidthHeightDepth && !hasLenDimensions
}

/** Extracts base dimensions from root group component. */
export function getBaseDimensions(
  transforms: Record<string, ComponentTransform>,
  config: Model3dConfig | null,
  parameterDefaults?: Record<string, number> | null,
): BaseDimensions {
  const resolved = computeResolvedDimensions(transforms, config, parameterDefaults)
  const rootKey = Object.keys(transforms).find((k) => {
    const t = transforms[k]
    return t != null && isGroupContainer(t)
  })
  if (!rootKey) {
    return { width: 100, height: 75, depth: 60 }
  }
  const r = resolved[rootKey]
  if (!r) return { width: 100, height: 75, depth: 60 }
  return {
    width: r.width ?? r.lenx ?? 100,
    height: r.height ?? r.lenz ?? 75,
    depth: r.depth ?? r.leny ?? 60,
  }
}

/** Evaluates a formula string. Supports: parent!width, parent!height, parent!depth, LenX, LenY, LenZ, parent!top_thickness, parent!bottom_thickness. */
export function evaluateFormula(
  formula: string,
  context: {
    parentDimensions?: ResolvedComponentDimensions
    selfDimensions?: ResolvedComponentDimensions
    params?: Record<string, number>
  },
): number {
  let expr = formula.trim()
  if (!expr.startsWith("=")) return Number.parseFloat(expr) || 0
  expr = expr.slice(1).trim()

  const parent = context.parentDimensions
  const self = context.selfDimensions
  const params: Record<string, number> = context.params ?? {}

  const replacements: [RegExp, string][] = [
    [/\bparent!\s*width\b/gi, String(parent?.width ?? params.width ?? params.WIDTH ?? 0)],
    [/\bparent!\s*height\b/gi, String(parent?.height ?? params.height ?? params.HEIGHT ?? 0)],
    [/\bparent!\s*depth\b/gi, String(parent?.depth ?? params.depth ?? params.DEPTH ?? 0)],
    [
      /\bparent!\s*top_thickness\b/gi,
      String(params.top_thickness ?? params.TOP_THICKNESS ?? parent?.lenz ?? 0),
    ],
    [
      /\bparent!\s*bottom_thickness\b/gi,
      String(params.bottom_thickness ?? params.BOTTOM_THICKNESS ?? parent?.lenz ?? 0),
    ],
    [/\bLenX\b/g, String(self?.lenx ?? 0)],
    [/\bLenY\b/g, String(self?.leny ?? 0)],
    [/\bLenZ\b/g, String(self?.lenz ?? 0)],
    [/\bwidth\b/gi, String(params.width ?? params.WIDTH ?? 0)],
    [/\bheight\b/gi, String(params.height ?? params.HEIGHT ?? 0)],
    [/\bdepth\b/gi, String(params.depth ?? params.DEPTH ?? 0)],
  ]

  for (const [re, replacement] of replacements) {
    expr = expr.replace(re, replacement)
  }

  return safeEvalExpression(expr)
}

/** Safe evaluation of numeric expression (only numbers and + - * / ( )). */
function safeEvalExpression(expr: string): number {
  const trimmed = expr.trim()
  if (!trimmed) return 0
  const sanitized = trimmed.replace(/[^\d.\s+\-*/()]/g, "")
  if (sanitized !== trimmed.replace(/\s/g, "")) return 0
  try {
    return evaluateNumericExpression(sanitized)
  } catch {
    return 0
  }
}

/** Recursive descent parser for numeric expressions. */
function evaluateNumericExpression(expr: string): number {
  let i = 0
  const skipWs = (): void => {
    while (i < expr.length && /\s/.test(expr[i] ?? "")) i++
  }
  const parsePrimary = (): number => {
    skipWs()
    if (i >= expr.length) return 0
    if (expr[i] === "(") {
      i++
      const v = parseAdd()
      skipWs()
      if (expr[i] === ")") i++
      return v
    }
    let num = ""
    while (i < expr.length && /[\d.]/.test(expr[i] ?? "")) {
      num += expr[i]
      i++
    }
    return Number.parseFloat(num) || 0
  }
  const parseMul = (): number => {
    let left = parsePrimary()
    skipWs()
    while (i < expr.length) {
      const op = expr[i]
      if (op === "*") {
        i++
        left *= parsePrimary()
      } else if (op === "/") {
        i++
        const right = parsePrimary()
        left = right !== 0 ? left / right : 0
      } else break
      skipWs()
    }
    return left
  }
  const parseAdd = (): number => {
    let left = parseMul()
    skipWs()
    while (i < expr.length) {
      const op = expr[i]
      if (op === "+") {
        i++
        left += parseMul()
      } else if (op === "-") {
        i++
        left -= parseMul()
      } else break
      skipWs()
    }
    return left
  }
  return parseAdd()
}

/** Gets numeric attribute value from config by param code (e.g. "width", "height"). */
export function getAttributeValueFromConfig(
  config: Model3dConfig | null,
  paramCode: string,
  parameterDefaults?: Record<string, number> | null,
): number {
  if (!config) {
    const def = parameterDefaults?.[paramCode.toUpperCase().replace(/[^A-Z0-9_]/g, "_")]
    return typeof def === "number" ? def : 0
  }
  const codeLower = paramCode.toLowerCase()
  for (const comp of config.components) {
    const attrs = config.attributesByComponent[comp.id] ?? []
    const attr = attrs.find((a) => a.code.toLowerCase() === codeLower)
    if (!attr) continue
    const otherValues = config.selectedOtherValuesByComponent[comp.id] ?? {}
    const v = otherValues[attr.id]
    if (typeof v === "number" && Number.isFinite(v)) return v
    const fallback =
      attr.type === "INTEGER"
        ? (attr.defaultInt ?? attr.minInt ?? 0)
        : (attr.defaultDecimal ?? attr.minDecimal ?? 0)
    return typeof fallback === "number" ? fallback : 0
  }
  const def = parameterDefaults?.[paramCode.toUpperCase().replace(/[^A-Z0-9_]/g, "_")]
  return typeof def === "number" ? def : 0
}

/** Builds params map from config and parameterDefaults for formula evaluation. */
function buildParamsForEvaluation(
  config: Model3dConfig | null,
  parameterDefaults?: Record<string, number> | null,
): Record<string, number> {
  const params: Record<string, number> = {}
  if (parameterDefaults) {
    for (const [k, v] of Object.entries(parameterDefaults)) {
      if (typeof v === "number") params[k] = v
    }
  }
  if (!config) return params
  for (const comp of config.components) {
    const attrs = config.attributesByComponent[comp.id] ?? []
    for (const attr of attrs) {
      if (attr.type !== "INTEGER" && attr.type !== "DECIMAL") continue
      const otherValues = config.selectedOtherValuesByComponent[comp.id] ?? {}
      const v = otherValues[attr.id]
      const fallback =
        attr.type === "INTEGER"
          ? (attr.defaultInt ?? attr.minInt ?? 0)
          : (attr.defaultDecimal ?? attr.minDecimal ?? 0)
      const value = typeof v === "number" ? v : fallback
      if (typeof value === "number") {
        params[attr.code] = value
        params[attr.code.toUpperCase().replace(/[^A-Z0-9_]/g, "_")] = value
      }
    }
  }
  return params
}

function resolveValue(
  val: string | number | null | undefined,
  t: ComponentTransform,
  parentDims: ResolvedComponentDimensions | undefined,
  params: Record<string, number>,
  selfLenx: number,
  selfLeny: number,
  selfLenz: number,
): number {
  if (val == null) return 0
  if (typeof val === "number" && Number.isFinite(val)) return val
  const str = String(val).trim()
  if (!str) return 0
  if (str.startsWith("=")) {
    const selfPartial: ResolvedComponentDimensions = {
      x: 0,
      y: 0,
      z: 0,
      lenx: selfLenx,
      leny: selfLeny,
      lenz: selfLenz,
    }
    return evaluateFormula(str, {
      parentDimensions: parentDims,
      selfDimensions: selfPartial,
      params,
    })
  }
  const num = Number.parseFloat(str)
  return Number.isFinite(num) ? num : 0
}

/** Computes resolved dimensions for all components (formulas evaluated). */
export function computeResolvedDimensions(
  transforms: Record<string, ComponentTransform>,
  config: Model3dConfig | null,
  parameterDefaults?: Record<string, number> | null,
): ResolvedDimensions {
  const params = buildParamsForEvaluation(config, parameterDefaults)
  const result: ResolvedDimensions = {}

  const resolveOne = (compName: string): ResolvedComponentDimensions => {
    if (result[compName]) return result[compName]
    const t = transforms[compName]
    if (!t) return { x: 0, y: 0, z: 0, lenx: 0, leny: 0, lenz: 0 }

    const parentName = (t._parent as string) ?? null
    let parentDims: ResolvedComponentDimensions | undefined
    if (parentName) {
      parentDims = resolveOne(parentName)
    }

    const lenx = resolveValue(t.lenx, t, parentDims, params, 0, 0, 0)
    const leny = resolveValue(t.leny, t, parentDims, params, lenx, 0, 0)
    const lenz = resolveValue(t.lenz, t, parentDims, params, lenx, leny, 0)

    const selfDims: ResolvedComponentDimensions = {
      x: resolveValue(t.x, t, parentDims, params, lenx, leny, lenz),
      y: resolveValue(t.y, t, parentDims, params, lenx, leny, lenz),
      z: resolveValue(t.z, t, parentDims, params, lenx, leny, lenz),
      lenx,
      leny,
      lenz,
    }
    if (parentDims) {
      selfDims.width = parentDims.width ?? parentDims.lenx
      selfDims.height = parentDims.height ?? parentDims.lenz
      selfDims.depth = parentDims.depth ?? parentDims.leny
    } else if ("width" in t || "height" in t || "depth" in t) {
      selfDims.width = resolveValue(t.width, t, undefined, params, lenx, leny, lenz)
      selfDims.height = resolveValue(t.height, t, undefined, params, lenx, leny, lenz)
      selfDims.depth = resolveValue(t.depth, t, undefined, params, lenx, leny, lenz)
    }
    result[compName] = selfDims
    return selfDims
  }

  for (const compName of Object.keys(transforms)) {
    resolveOne(compName)
  }
  return result
}

/** Extracts parameter keys that affect transforms (from formulas and defaults). */
export function getParamKeysAffectingTransforms(
  transforms: Record<string, ComponentTransform>,
  parameterDefaults?: Record<string, number> | null,
): string[] {
  const keys = new Set<string>()
  if (parameterDefaults) {
    for (const k of Object.keys(parameterDefaults)) keys.add(k)
  }
  const formulaPattern =
    /\b(?:parent!\s*)?(?:width|height|depth|top_thickness|bottom_thickness)\b|\bLen[XYZ]\b|[\bwidth\b|\bheight\b|\bdepth\b]/gi
  for (const t of Object.values(transforms)) {
    for (const v of Object.values(t)) {
      if (typeof v === "string" && v.startsWith("=")) {
        const matches = v.match(formulaPattern)
        if (matches) {
          for (const m of matches) {
            const normalized = m.replace(/\s+/g, "").toLowerCase()
            if (normalized.includes("parent!")) {
              keys.add(normalized.replace("parent!", ""))
            } else if (normalized === "lenx" || normalized === "leny" || normalized === "lenz") {
              keys.add(normalized)
            } else {
              keys.add(normalized)
            }
          }
        }
      }
    }
  }
  return [...keys]
}

function normalizeParamKey(key: string): string {
  return key.toUpperCase().replace(/[^A-Z0-9_]/g, "_")
}

/** Returns true if config values match parameterDefaults for the given param keys. */
export function areParamsAtDefaults(
  config: Model3dConfig | null,
  parameterDefaults?: Record<string, number> | null,
  paramKeys?: string[],
): boolean {
  if (!parameterDefaults || !paramKeys?.length) return true
  if (!config) return true
  for (const key of paramKeys) {
    const def = parameterDefaults[normalizeParamKey(key)] ?? parameterDefaults[key]
    if (typeof def !== "number") continue
    const val = getAttributeValueFromConfig(config, key, parameterDefaults)
    if (Math.abs(val - def) > 1e-6) return false
  }
  return true
}

/** Computes target transforms (position, scale) per component in GLB units. */
export function computeTargetTransforms(
  transforms: Record<string, ComponentTransform>,
  resolved: ResolvedDimensions,
): Record<string, NodeTargetTransform> {
  const result: Record<string, NodeTargetTransform> = {}
  for (const [compName, t] of Object.entries(transforms)) {
    if (isGroupContainer(t)) continue
    const r = resolved[compName]
    if (!r) continue
    result[compName] = {
      position: mapJsonPositionToGlbUnits(r.x, r.y, r.z),
      scale: [
        cmToGlbUnits(r.lenx > 0 ? r.lenx : 1),
        cmToGlbUnits(r.leny > 0 ? r.leny : 1),
        cmToGlbUnits(r.lenz > 0 ? r.lenz : 1),
      ],
    }
  }
  return result
}

/** Computes delta transforms from baseline (position delta, scale ratio). */
export function computeDeltaTransforms(
  transforms: Record<string, ComponentTransform>,
  resolved: ResolvedDimensions,
  parameterDefaults: Record<string, number> | null,
  baselineTransforms: Record<string, BaselineTransformFromGlb>,
  _config: Model3dConfig | null,
): Record<string, DeltaTransformFromUserParams> {
  const result: Record<string, DeltaTransformFromUserParams> = {}
  const defaultResolved =
    parameterDefaults != null
      ? computeResolvedDimensions(transforms, null, parameterDefaults)
      : null
  const targets = computeTargetTransforms(transforms, resolved)
  for (const [compName, baseline] of Object.entries(baselineTransforms)) {
    const target = targets[compName]
    if (!target) continue
    const baseScale = baseline.scale
    let scaleRatio: [number, number, number] = [1, 1, 1]
    if (defaultResolved?.[compName]) {
      const def = defaultResolved[compName]
      const cur = resolved[compName]
      if (cur) {
        scaleRatio = [
          def.lenx > 0 ? cur.lenx / def.lenx : 1,
          def.leny > 0 ? cur.leny / def.leny : 1,
          def.lenz > 0 ? cur.lenz / def.lenz : 1,
        ]
      }
    } else {
      scaleRatio = [
        baseScale[0] !== 0 ? target.scale[0] / baseScale[0] : 1,
        baseScale[1] !== 0 ? target.scale[1] / baseScale[1] : 1,
        baseScale[2] !== 0 ? target.scale[2] / baseScale[2] : 1,
      ]
    }
    result[compName] = {
      position: [
        target.position[0] - baseline.position[0],
        target.position[1] - baseline.position[1],
        target.position[2] - baseline.position[2],
      ],
      scale: scaleRatio,
    }
  }
  return result
}

/** Logs parametric state for debugging. */
export function logParametricState(
  resolved: ResolvedDimensions,
  paramKeys: string[],
  isAtDefaults: boolean,
  config: Model3dConfig | null,
  parameterDefaults?: Record<string, number> | null,
  deltas?: Record<string, DeltaTransformFromUserParams>,
): void {
  if (process.env.NODE_ENV !== "development") return
  console.warn("[ModelViewer3D] Parametric state:", {
    resolved: Object.fromEntries(
      Object.entries(resolved).map(([k, v]) => [
        k,
        { x: v.x, y: v.y, z: v.z, lenx: v.lenx, leny: v.leny, lenz: v.lenz },
      ]),
    ),
    paramKeys,
    isAtDefaults,
    hasConfig: config != null,
    parameterDefaultsSample: parameterDefaults
      ? Object.fromEntries(Object.entries(parameterDefaults).slice(0, 6))
      : null,
    deltasSample: deltas ? Object.fromEntries(Object.entries(deltas).slice(0, 3)) : null,
  })
}
