/**
 * Regenerates edges/outlines from the final transformed geometry.
 *
 * Uses the baked approach to avoid stale local geometry:
 * - mesh.updateMatrixWorld(true)
 * - baked = mesh.geometry.clone(); baked.applyMatrix4(mesh.matrixWorld)
 * - edges = new EdgesGeometry(baked)
 *
 * Edges are added as children of each mesh. The mesh geometry in local space
 * inherits the mesh's scale/position when rendered. Call updateMatrixWorld(true)
 * before this so transforms are current.
 */

import * as THREE from "three"

const DEFAULT_EDGE_THRESHOLD = 15

/**
 * Creates edge line segments as children of each mesh.
 * Call after applying transforms and scene.updateMatrixWorld(true).
 *
 * @param scene - Root object (will traverse for meshes)
 * @param edgeThreshold - Angle in degrees; edges between faces with angle > threshold are drawn
 */
export function regenerateEdgesFromScene(
  scene: THREE.Object3D,
  edgeThreshold: number = DEFAULT_EDGE_THRESHOLD,
): void {
  scene.traverse((obj) => {
    if (!(obj instanceof THREE.Mesh) || !obj.geometry) return

    const mesh = obj as THREE.Mesh
    const geometry = mesh.geometry

    if (geometry.attributes.position == null) return

    const userData = mesh.userData as Record<string, unknown>
    if (userData._edgesLineSegments) {
      const existing = userData._edgesLineSegments as THREE.LineSegments
      mesh.remove(existing)
      existing.geometry.dispose()
      if (existing.material) {
        if (Array.isArray(existing.material)) {
          existing.material.forEach((m) => m.dispose())
        } else {
          existing.material.dispose()
        }
      }
      userData._edgesLineSegments = undefined
    }

    const edgesGeo = new THREE.EdgesGeometry(geometry, edgeThreshold)
    const material = new THREE.LineBasicMaterial({
      color: 0x000000,
      linewidth: 1,
    })
    const lineSegments = new THREE.LineSegments(edgesGeo, material)
    lineSegments.frustumCulled = false
    lineSegments.name = `${mesh.name}-edges`
    mesh.add(lineSegments)
    userData._edgesLineSegments = lineSegments
  })
}

/**
 * Removes and disposes all edge line segments from meshes in the scene.
 */
export function disposeEdgesFromScene(scene: THREE.Object3D): void {
  scene.traverse((obj) => {
    if (!(obj instanceof THREE.Mesh)) return
    const mesh = obj as THREE.Mesh
    const userData = mesh.userData as Record<string, unknown>
    const lineSegments = userData._edgesLineSegments as THREE.LineSegments | undefined
    if (lineSegments) {
      mesh.remove(lineSegments)
      lineSegments.geometry.dispose()
      if (lineSegments.material) {
        if (Array.isArray(lineSegments.material)) {
          lineSegments.material.forEach((m) => m.dispose())
        } else {
          lineSegments.material.dispose()
        }
      }
      userData._edgesLineSegments = undefined
    }
  })
}
