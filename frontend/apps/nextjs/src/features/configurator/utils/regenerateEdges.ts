import * as THREE from "three"

const DEFAULT_EDGE_THRESHOLD = 15

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
