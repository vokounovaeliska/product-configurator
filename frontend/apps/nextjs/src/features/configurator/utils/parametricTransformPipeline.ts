/**
 * Parametric transform pipeline for SketchUp-derived GLB models.
 * Resolves formulas (parent!length, parent!width, LenX, etc.) and computes position/scale deltas.
 * DC `x,y,z` and Len* are treated in the same axis order as the glTF scene (see SketchUp export).
 */

import type { Model3dConfig } from "../types/model3dConfig"

/**
 * SketchUp exports GLB with inch values (1 unit = 1 inch); parameters.json uses cm.
 * 1 inch = 2.54 cm.
 */
const CM_PER_INCH = 2.54

/** Convert cm (parameters.json) to GLB scene units (inches). */
export function cmToGlbUnits(cm: number): number {
  return cm / CM_PER_INCH
}

/** Convert GLB scene units (inches) to cm. */
export function glbUnitsToCm(glbUnits: number): number {
  return glbUnits * CM_PER_INCH
}

/** Component transform from parameters.json: x, y, z, lenx, leny, lenz, length/width/height, thickness*, material, _parent. */
export type ComponentTransform = Record<string, string | number | null | undefined>

/** Base outer dimensions: length × width × height (cm). */
export type BaseDimensions = {
  length: number
  width: number
  height: number
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
  /** Span along X (length). */
  length?: number
  /** Span along Z (second horizontal, “width” in plan). */
  width?: number
  /** Span along Y (height). */
  height?: number
}

/** Resolved dimensions per component name. */
export type ResolvedDimensions = Record<string, ResolvedComponentDimensions>

/** Returns true if component has only global box dims (no lenx/leny/lenz). Skips for transform application. */
export function isGroupContainer(transform: ComponentTransform): boolean {
  const hasLenx = "lenx" in transform && transform.lenx != null
  const hasLeny = "leny" in transform && transform.leny != null
  const hasLenz = "lenz" in transform && transform.lenz != null
  const hasLenDimensions = hasLenx || hasLeny || hasLenz
  const t = transform as Record<string, string | number | null | undefined>
  const hasBox =
    ("length" in t ||
      "width" in t ||
      "height" in t ||
      "delka" in t ||
      "sirka" in t ||
      "vyska" in t) &&
    (t.length != null ||
      t.width != null ||
      t.height != null ||
      t.delka != null ||
      t.sirka != null ||
      t.vyska != null)
  return hasBox && !hasLenDimensions
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
    return { length: 100, width: 60, height: 75 }
  }
  const r = resolved[rootKey]
  if (!r) return { length: 100, width: 60, height: 75 }
  return {
    length: r.length ?? r.lenx ?? 100,
    width: r.width ?? r.lenz ?? 60,
    height: r.height ?? r.leny ?? 75,
  }
}

function pickTransformScalar(
  t: ComponentTransform,
  ...keys: string[]
): string | number | null | undefined {
  const tr = t as Record<string, string | number | null | undefined>
  for (const k of keys) {
    if (k in tr && tr[k] != null) return tr[k]
  }
  return undefined
}

/**
 * Root group often omits length/width on componentTransforms; child formulas still use parent!length.
 * If parent resolved dim is missing or zero, fall back to global config params.
 */
function parentDimOrParams(
  parent: ResolvedComponentDimensions | undefined,
  key: "length" | "width" | "height",
  params: Record<string, number>,
): number {
  const pv = parent?.[key]
  if (pv != null && pv > 0) return pv
  const czech =
    key === "length"
      ? (params.delka ?? params.DELKA)
      : key === "width"
        ? (params.sirka ?? params.SIRKA)
        : (params.vyska ?? params.VYSKA)
  const fromParams = params[key] ?? params[key.toUpperCase()] ?? czech
  return typeof fromParams === "number" ? fromParams : 0
}

/**
 * Evaluates a formula string.
 * Global box: length (X), width (Z), height (Y); thickness* for slab depth.
 */
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
    [/\bparent!\s*length\b/gi, String(parentDimOrParams(parent, "length", params))],
    [/\bparent!\s*width\b/gi, String(parentDimOrParams(parent, "width", params))],
    [/\bparent!\s*height\b/gi, String(parentDimOrParams(parent, "height", params))],
    // Legacy DC name "depth" for the second horizontal (same as width in parameters.json).
    [/\bparent!\s*depth\b/gi, String(parentDimOrParams(parent, "width", params))],
    [
      /\bparent!\s*top_thickness\b/gi,
      String(params.top_thickness ?? params.TOP_THICKNESS ?? parent?.lenz ?? 0),
    ],
    [
      /\bparent!\s*bottom_thickness\b/gi,
      String(params.bottom_thickness ?? params.BOTTOM_THICKNESS ?? parent?.lenz ?? 0),
    ],
    [/\bparent!\s*diameter_top\b/gi, String(params.diameter_top ?? params.DIAMETER_TOP ?? 0)],
    [
      /\bparent!\s*thickness_top\b/gi,
      String(params.thickness_top ?? params.THICKNESS_TOP ?? parent?.lenz ?? 0),
    ],
    [/\bparent!\s*thickness\b/gi, String(params.thickness ?? params.THICKNESS ?? 0)],
    [/\bparent!\s*tloustka\b/gi, String(params.tloustka ?? params.TLOUSTKA ?? 0)],
    [/\bparent!\s*delka\b/gi, String(parentDimOrParams(parent, "length", params))],
    [/\bparent!\s*sirka\b/gi, String(parentDimOrParams(parent, "width", params))],
    [/\bparent!\s*vyska\b/gi, String(parentDimOrParams(parent, "height", params))],
    [/\bLenX\b/g, String(self?.lenx ?? 0)],
    [/\bLenY\b/g, String(self?.leny ?? 0)],
    [/\bLenZ\b/g, String(self?.lenz ?? 0)],
    [/\blength\b/gi, String(params.length ?? params.LENGTH ?? 0)],
    [/\bdepth\b/gi, String(params.width ?? params.WIDTH ?? 0)],
    [/\bwidth\b/gi, String(params.width ?? params.WIDTH ?? 0)],
    [/\bheight\b/gi, String(params.height ?? params.HEIGHT ?? 0)],
    [/\bdelka\b/gi, String(params.length ?? params.LENGTH ?? params.delka ?? params.DELKA ?? 0)],
    [/\bsirka\b/gi, String(params.width ?? params.WIDTH ?? params.sirka ?? params.SIRKA ?? 0)],
    [/\bvyska\b/gi, String(params.height ?? params.HEIGHT ?? params.vyska ?? params.VYSKA ?? 0)],
    [/\bthickness\b/gi, String(params.thickness ?? params.THICKNESS ?? 0)],
    [/\btloustka\b/gi, String(params.tloustka ?? params.TLOUSTKA ?? 0)],
  ]

  for (const [re, replacement] of replacements) {
    expr = expr.replace(re, replacement)
  }

  // Generic: parent!paramName → params lookup (for round tables: diameter_top, etc.)
  const parentParamMatches = expr.matchAll(/\bparent!\s*([a-zA-Z_][a-zA-Z0-9_]*)\b/g)
  for (const m of parentParamMatches) {
    const paramName = m[1]
    if (!paramName) continue
    const paramKey = paramName.toUpperCase().replace(/[^A-Z0-9_]/g, "_")
    const val = params[paramName] ?? params[paramKey] ?? params[paramName.toLowerCase()] ?? 0
    expr = expr.replace(m[0], String(val))
  }

  // Root transforms often use =length / =width (no parent!) — substitute bare param names from config.
  expr = substituteBareParamIdentifiers(expr, params)

  return safeEvalExpression(expr)
}

function escapeRegexChars(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}

/** Replaces identifiers like length, width, Noha_lenx with numeric values from params (longest keys first). */
function substituteBareParamIdentifiers(expr: string, params: Record<string, number>): string {
  let result = expr
  const keys = Object.keys(params).sort((a, b) => b.length - a.length)
  const seenLower = new Set<string>()
  for (const key of keys) {
    if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(key)) continue
    const lower = key.toLowerCase()
    if (seenLower.has(lower)) continue
    seenLower.add(lower)
    const re = new RegExp(`\\b${escapeRegexChars(key)}\\b`, "gi")
    result = result.replace(re, String(params[key] ?? 0))
  }
  return result
}

/** Safe evaluation of numeric expression (only numbers and + - * / ( )). */
function safeEvalExpression(expr: string): number {
  const trimmed = expr.trim()
  if (!trimmed) return 0
  const sanitized = trimmed.replace(/[^\d.\s+\-*/()]/g, "")
  // Reject only when disallowed characters were stripped (not when spaces differ).
  const withoutSpaces = (s: string) => s.replace(/\s/g, "")
  if (withoutSpaces(sanitized) !== withoutSpaces(trimmed)) return 0
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

/** Maps Czech SketchUp dimension names to English keys used in formulas (length/width/height). */
function applyCanonicalDimensionAliases(params: Record<string, number>): void {
  const pick = (...keys: string[]): number | undefined => {
    for (const k of keys) {
      const v = params[k] ?? params[k.toUpperCase()] ?? params[k.toLowerCase()]
      if (typeof v === "number" && Number.isFinite(v)) return v
    }
    return undefined
  }
  const L = pick("length", "delka", "DELKA")
  const W = pick("width", "sirka", "SIRKA")
  const H = pick("height", "vyska", "VYSKA")
  if (L != null) {
    params.length = params.length ?? L
    params.LENGTH = params.LENGTH ?? L
  }
  if (W != null) {
    params.width = params.width ?? W
    params.WIDTH = params.WIDTH ?? W
  }
  if (H != null) {
    params.height = params.height ?? H
    params.HEIGHT = params.HEIGHT ?? H
  }
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
  if (!config) {
    applyCanonicalDimensionAliases(params)
    return params
  }
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
        const up = attr.code.toUpperCase().replace(/[^A-Z0-9_]/g, "_")
        params[up] = value
        params[attr.code.toLowerCase()] = value
      }
    }
  }
  applyCanonicalDimensionAliases(params)
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
      selfDims.length = parentDims.length ?? parentDims.lenx
      selfDims.width = parentDims.width ?? parentDims.lenz
      selfDims.height = parentDims.height ?? parentDims.leny
    } else if (
      "length" in t ||
      "width" in t ||
      "height" in t ||
      "delka" in t ||
      "sirka" in t ||
      "vyska" in t
    ) {
      selfDims.length = resolveValue(
        pickTransformScalar(t, "length", "delka"),
        t,
        undefined,
        params,
        lenx,
        leny,
        lenz,
      )
      selfDims.width = resolveValue(
        pickTransformScalar(t, "width", "sirka"),
        t,
        undefined,
        params,
        lenx,
        leny,
        lenz,
      )
      selfDims.height = resolveValue(
        pickTransformScalar(t, "height", "vyska"),
        t,
        undefined,
        params,
        lenx,
        leny,
        lenz,
      )
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
    /\b(?:parent!\s*)?(?:length|width|height|delka|sirka|vyska|thickness|tloustka|top_thickness|bottom_thickness|diameter_top|thickness_top)\b|\bparent!\s*[a-zA-Z_][a-zA-Z0-9_]*\b|\bLen[XYZ]\b|\blength\b|\bwidth\b|\bheight\b|\bthickness\b|\btloustka\b/gi
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

/** Returns true if the transform has explicit position (x, y, or z). */
function hasPositionFormula(t: ComponentTransform): boolean {
  return "x" in t || "y" in t || "z" in t
}

/**
 * Computes target transforms (position in GLB units, scale as ratio vs default-resolved Len*).
 */
export function computeTargetTransforms(
  transforms: Record<string, ComponentTransform>,
  resolved: ResolvedDimensions,
  parameterDefaults?: Record<string, number> | null,
): Record<string, NodeTargetTransform> {
  const defaultResolved =
    parameterDefaults != null
      ? computeResolvedDimensions(transforms, null, parameterDefaults)
      : null
  const result: Record<string, NodeTargetTransform> = {}
  for (const [compName, t] of Object.entries(transforms)) {
    if (isGroupContainer(t)) continue
    const r = resolved[compName]
    if (!r) continue
    const def = defaultResolved?.[compName]
    const scaleRatio: [number, number, number] =
      def && def.lenx > 0 && def.leny > 0 && def.lenz > 0
        ? [
            r.lenx > 0 ? r.lenx / def.lenx : 1,
            r.leny > 0 ? r.leny / def.leny : 1,
            r.lenz > 0 ? r.lenz / def.lenz : 1,
          ]
        : [1, 1, 1]
    result[compName] = {
      position: mapJsonPositionToGlbUnits(r.x, r.y, r.z),
      scale: scaleRatio,
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
  const targets = computeTargetTransforms(transforms, resolved, parameterDefaults)
  const result: Record<string, DeltaTransformFromUserParams> = {}
  for (const [compName, baseline] of Object.entries(baselineTransforms)) {
    const target = targets[compName]
    if (!target) continue
    const t = transforms[compName]
    const positionDelta: [number, number, number] =
      t && hasPositionFormula(t)
        ? [
            target.position[0] - baseline.position[0],
            target.position[1] - baseline.position[1],
            target.position[2] - baseline.position[2],
          ]
        : [0, 0, 0]
    result[compName] = {
      position: positionDelta,
      scale: target.scale,
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
