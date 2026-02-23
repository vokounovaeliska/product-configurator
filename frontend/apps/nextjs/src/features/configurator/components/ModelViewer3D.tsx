"use client"

import { Suspense, useEffect, useMemo, useRef } from "react"
import { OrbitControls, useGLTF } from "@react-three/drei"
import { Canvas, useThree } from "@react-three/fiber"
import * as THREE from "three"

import { env } from "@/config/env"
import { getImageUrl } from "@/utils/imageUrl"

import type { Model3dConfig } from "../types/model3dConfig"
import { getColorForOption } from "../utils/optionColors"

type Props = {
  modelUrl: string
  className?: string
  config?: Model3dConfig | null
}

/** Base model size in cm (SketchUp convention: 100 cm diameter for round tables). */
const BASE_PRUMER_CM = 100
const BASE_TLOUSTKA_CM = 4

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
      return value * 2.54
    default:
      return value
  }
}

function nodeNameMatches(nodeName: string, componentLabel: string, componentCode: string): boolean {
  const n = nodeName.toLowerCase().trim()
  if (!n) return false
  const label = componentLabel.toLowerCase().trim()
  const code = componentCode.toLowerCase().trim()
  return n === label || n === code || n.includes(label) || n.includes(code)
}

function findNodeByName(scene: THREE.Object3D, label: string, code: string): THREE.Object3D | null {
  let found: THREE.Object3D | null = null
  scene.traverse((obj: THREE.Object3D) => {
    if (!found && nodeNameMatches(obj.name, label, code)) {
      found = obj
    }
  })
  return found
}

function getColorTargetFromCode(code: string): string | null {
  const lower = code.toLowerCase()
  if (lower.startsWith("color_")) return lower.slice(6)
  if (lower.startsWith("barva_")) return lower.slice(6)
  return null
}

function applyColorToNode(node: THREE.Object3D, hex: string): void {
  const color = new THREE.Color(hex)
  node.traverse((child: THREE.Object3D) => {
    if (!(child instanceof THREE.Mesh) || !child.material) return
    const rawMat = (
      Array.isArray(child.material) ? child.material[0] : child.material
    ) as THREE.Material
    const mat = rawMat as THREE.MeshStandardMaterial
    if (!mat || !("color" in mat)) return

    const userData = child.userData as Record<string, unknown>
    if (!userData._materialCloned) {
      child.material = mat.clone()
      userData._materialCloned = true
    }
    const m = child.material as THREE.MeshStandardMaterial
    m.map = null
    m.color.copy(color)
  })
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

function applyConfigToScene(
  scene: THREE.Object3D,
  config: Model3dConfig,
  texturesByUrl?: Map<string, THREE.Texture>,
): void {
  const {
    components,
    attributesByComponent,
    selectedOptionsByComponent,
    selectedOtherValuesByComponent,
  } = config

  for (const comp of components) {
    const attrs = attributesByComponent[comp.id] ?? []
    const selectedOptions = selectedOptionsByComponent[comp.id] ?? {}
    const otherValues = selectedOtherValuesByComponent[comp.id] ?? {}

    for (const attr of attrs) {
      const code = attr.code.toLowerCase()

      if (code.startsWith("color") || code.startsWith("barva")) {
        const targetName = getColorTargetFromCode(code)
        const targetNode = targetName
          ? findNodeByName(scene, targetName, targetName.toUpperCase())
          : findNodeByName(scene, comp.label, comp.code)
        if (targetNode) {
          const opt = selectedOptions[attr.id]
          if (opt) {
            const texture = opt.imageUrl && texturesByUrl?.get(opt.imageUrl)
            if (texture) {
              applyTextureToNode(targetNode, texture)
            } else {
              const hex = getColorForOption(opt.colorHex, opt.value, opt.label)
              applyColorToNode(targetNode, hex)
            }
          }
        }
      }
    }

    const diameterWithUnit =
      getNumericValueWithUnit(attrs, otherValues, "diameter_top") ??
      getNumericValueWithUnit(attrs, otherValues, "diameter") ??
      getNumericValueWithUnit(attrs, otherValues, "prumer")
    const thicknessWithUnit =
      getNumericValueWithUnit(attrs, otherValues, "thickness_top") ??
      getNumericValueWithUnit(attrs, otherValues, "thickness") ??
      getNumericValueWithUnit(attrs, otherValues, "tloustka")

    const scaleTargetNode =
      diameterWithUnit != null || thicknessWithUnit != null
        ? (findNodeByName(scene, "top", "TOP") ?? findNodeByName(scene, comp.label, comp.code))
        : null

    if (scaleTargetNode) {
      scaleTargetNode.scale.set(1, 1, 1)
      const diameterCm =
        diameterWithUnit != null && diameterWithUnit.value > 0
          ? toCm(diameterWithUnit.value, diameterWithUnit.unit)
          : null
      const thicknessCm =
        thicknessWithUnit != null && thicknessWithUnit.value > 0
          ? toCm(thicknessWithUnit.value, thicknessWithUnit.unit)
          : null
      const diamScale = diameterCm != null ? diameterCm / BASE_PRUMER_CM : 1
      const thickScale = thicknessCm != null ? thicknessCm / BASE_TLOUSTKA_CM : 1
      // Round table: diameter = circle (scale both horizontal axes), thickness = the thin dimension.
      // SketchUp/GLB: circle often in XY plane, thickness along Z; or XZ plane, thickness Y.
      // Try XY circle + Z thickness (SketchUp Z-up style): diameter→X,Y, thickness→Z
      scaleTargetNode.scale.set(diamScale, diamScale, thickScale)
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

function collectTextureUrls(config: Model3dConfig): string[] {
  const urls = new Set<string>()
  for (const comp of config.components) {
    const selectedOptions = config.selectedOptionsByComponent[comp.id] ?? {}
    for (const opt of Object.values(selectedOptions)) {
      if (opt?.imageUrl) urls.add(opt.imageUrl)
    }
  }
  return [...urls]
}

function Model({ url, config }: { url: string; config?: Model3dConfig | null }) {
  const fullUrl = url.startsWith("http") ? url : `${env.NEXT_PUBLIC_REST_API_URL}${url}`
  const { scene: originalScene } = useGLTF(fullUrl)
  const { invalidate } = useThree()
  const texturesRef = useRef<THREE.Texture[]>([])

  const clonedScene = useMemo(() => originalScene.clone(true), [originalScene])

  useEffect(() => {
    if (!config || config.components.length === 0) return

    const textureUrls = collectTextureUrls(config)
    if (textureUrls.length === 0) {
      applyConfigToScene(clonedScene, config)
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
        applyConfigToScene(clonedScene, config, textureMap)
        invalidate()
      })
      .catch(() => {
        applyConfigToScene(clonedScene, config)
        invalidate()
      })

    return () => {
      isCancelled = true
      texturesRef.current.forEach((tex) => tex.dispose())
      texturesRef.current = []
    }
  }, [clonedScene, config, invalidate])

  /* object, intensity, position are React Three Fiber / Three.js props */
  return (
    // eslint-disable-next-line react/no-unknown-property -- R3F primitive and light props
    <primitive object={clonedScene} />
  )
}

export const ModelViewer3D = ({ modelUrl, className, config }: Props) => {
  return (
    <div className={`relative h-full min-h-[40vh] w-full ${className ?? ""}`}>
      <Canvas
        camera={{ position: [2, 2, 2], fov: 45 }}
        gl={{ antialias: true }}
      >
        {/* eslint-disable react/no-unknown-property -- R3F/Three.js uses object, intensity, position etc. */}
        <ambientLight intensity={0.8} />
        <directionalLight
          position={[5, 5, 5]}
          intensity={1}
        />
        {/* eslint-enable react/no-unknown-property */}
        <Suspense fallback={null}>
          <Model
            url={modelUrl}
            config={config}
          />
          <OrbitControls
            enablePan
            enableZoom
            enableRotate
          />
        </Suspense>
      </Canvas>
    </div>
  )
}
