import * as THREE from "three"

const DEBUG_NODE_NAMES = ["top", "bottom", "leg1", "leg2"]

const AXES_SIZE = 0.15
const BOX_COLORS: Record<string, number> = {
  top: 0xff0000,
  bottom: 0x00ff00,
  leg1: 0x0000ff,
  leg2: 0xff00ff,
}

export const EXPECTED_POSITIONS_CM: Record<string, { x: number; y: number; z: number }> = {
  leg1: { x: 1, y: 1, z: 0 },
  leg2: { x: 113, y: 1, z: 0 },
  top: { x: 0, y: 0, z: 55 },
  bottom: { x: 1.05, y: 1.05, z: 25.5 },
}

function findDebugNode(
  scene: THREE.Object3D,
  compName: string,
  findNode: (s: THREE.Object3D, name: string) => THREE.Object3D | null,
): THREE.Object3D | null {
  return findNode(scene, compName)
}

function computeBoundingBox(obj: THREE.Object3D): THREE.Box3 | null {
  const box = new THREE.Box3()
  obj.traverse((child: THREE.Object3D) => {
    if (child instanceof THREE.Mesh && child.geometry) {
      const geom = child.geometry as THREE.BufferGeometry
      geom.computeBoundingBox()
      const bbox: THREE.Box3 | null = geom.boundingBox
      if (bbox) {
        bbox.applyMatrix4(child.matrixWorld)
        box.union(bbox)
      }
    }
  })
  if (box.isEmpty()) return null
  return box
}

function computeLocalBoundingBox(obj: THREE.Object3D): THREE.Box3 | null {
  const box = new THREE.Box3()
  const invMatrix = new THREE.Matrix4()
  obj.traverse((child: THREE.Object3D) => {
    if (child instanceof THREE.Mesh && child.geometry) {
      const geom = child.geometry as THREE.BufferGeometry
      geom.computeBoundingBox()
      const bbox: THREE.Box3 | null = geom.boundingBox
      if (bbox) {
        invMatrix.copy(child.matrix).invert()
        const localBox: THREE.Box3 = bbox.clone().applyMatrix4(invMatrix)
        box.union(localBox)
      }
    }
  })
  if (box.isEmpty()) return null
  return box
}

export function addDebugVisualization(
  scene: THREE.Object3D,
  findNode: (s: THREE.Object3D, name: string) => THREE.Object3D | null,
): void {
  scene.updateMatrixWorld(true)

  for (const compName of DEBUG_NODE_NAMES) {
    const node = findDebugNode(scene, compName, findNode)
    if (!node) continue

    const userData = node.userData as Record<string, unknown>
    if (userData._debugAxes) {
      node.remove(userData._debugAxes as THREE.Object3D)
      ;(userData._debugAxes as THREE.AxesHelper).dispose?.()
      userData._debugAxes = undefined
    }
    if (userData._debugBox) {
      scene.remove(userData._debugBox as THREE.Object3D)
      const prev = userData._debugBox as THREE.LineSegments
      prev.geometry?.dispose()
      if (prev.material) {
        if (Array.isArray(prev.material)) prev.material.forEach((m) => m.dispose())
        else prev.material.dispose()
      }
      userData._debugBox = undefined
    }

    const axes = new THREE.AxesHelper(AXES_SIZE)
    axes.name = `${compName}-origin-gizmo`
    node.add(axes)
    userData._debugAxes = axes

    const box = computeBoundingBox(node)
    if (box && !box.isEmpty()) {
      const boxHelper = new THREE.Box3Helper(box, BOX_COLORS[compName] ?? 0xffff00)
      boxHelper.name = `${compName}-bbox`
      scene.add(boxHelper)
      userData._debugBox = boxHelper
    }
  }
}

export function disposeDebugVisualization(
  scene: THREE.Object3D,
  findNode: (s: THREE.Object3D, name: string) => THREE.Object3D | null,
): void {
  for (const compName of DEBUG_NODE_NAMES) {
    const node = findDebugNode(scene, compName, findNode)
    if (!node) continue

    const userData = node.userData as Record<string, unknown>
    if (userData._debugAxes) {
      node.remove(userData._debugAxes as THREE.Object3D)
      ;(userData._debugAxes as THREE.AxesHelper).dispose?.()
      userData._debugAxes = undefined
    }
    if (userData._debugBox) {
      scene.remove(userData._debugBox as THREE.Object3D)
      const box = userData._debugBox as THREE.LineSegments
      box.geometry?.dispose()
      if (box.material) {
        if (Array.isArray(box.material)) {
          box.material.forEach((m) => m.dispose())
        } else {
          box.material.dispose()
        }
      }
      userData._debugBox = undefined
    }
  }
}

export function logParametricNodeDebugInfo(
  scene: THREE.Object3D,
  findNode: (s: THREE.Object3D, name: string) => THREE.Object3D | null,
): void {
  scene.updateMatrixWorld(true)

  const entries: Record<string, unknown>[] = []

  for (const compName of DEBUG_NODE_NAMES) {
    const node = findDebugNode(scene, compName, findNode)
    if (!node) continue

    const localPos = node.position.clone()
    const worldPos = new THREE.Vector3()
    node.getWorldPosition(worldPos)

    const box = computeBoundingBox(node)
    const localBox = computeLocalBoundingBox(node)
    const expected = EXPECTED_POSITIONS_CM[compName]

    entries.push({
      node: compName,
      parent: node.parent?.name ?? "(none)",
      localPosition: { x: localPos.x, y: localPos.y, z: localPos.z },
      worldPosition: { x: worldPos.x, y: worldPos.y, z: worldPos.z },
      localBBoxMinMax: localBox
        ? {
            min: { x: localBox.min.x, y: localBox.min.y, z: localBox.min.z },
            max: { x: localBox.max.x, y: localBox.max.y, z: localBox.max.z },
          }
        : null,
      boundingBox: box
        ? {
            min: { x: box.min.x, y: box.min.y, z: box.min.z },
            max: { x: box.max.x, y: box.max.y, z: box.max.z },
            size: {
              x: box.max.x - box.min.x,
              y: box.max.y - box.min.y,
              z: box.max.z - box.min.z,
            },
          }
        : null,
      expectedCm: expected,
      expectedPositionCm: expected ? { x: expected.x, y: expected.y, z: expected.z } : null,
    })
  }

  console.warn("[ModelViewer3D] Parametric node debug:", entries)
}

export function logGlbTransformsOnLoad(
  scene: THREE.Object3D,
  findNode: (s: THREE.Object3D, name: string) => THREE.Object3D | null,
  label: string,
): void {
  scene.updateMatrixWorld(true)
  const entries: Record<string, unknown>[] = []
  for (const compName of DEBUG_NODE_NAMES) {
    const node = findDebugNode(scene, compName, findNode)
    if (!node) continue
    const worldPos = new THREE.Vector3()
    node.getWorldPosition(worldPos)
    entries.push({
      node: compName,
      parent: node.parent?.name ?? "(none)",
      localPosition: { x: node.position.x, y: node.position.y, z: node.position.z },
      localRotation: {
        x: node.rotation.x,
        y: node.rotation.y,
        z: node.rotation.z,
      },
      localScale: { x: node.scale.x, y: node.scale.y, z: node.scale.z },
      worldPosition: { x: worldPos.x, y: worldPos.y, z: worldPos.z },
    })
  }
  console.warn(`[ModelViewer3D] ${label}:`, entries)
}
