// ─── Types ────────────────────────────────────────────────────────────────────

export type Vec4 = [number, number, number, number]
export type Vec3 = [number, number, number]

// ─── Constants ────────────────────────────────────────────────────────────────

export const PROJECTION_DISTANCE = 2.0

// ─── Pure math ────────────────────────────────────────────────────────────────

export function generateTesseractVertices(): Vec4[] {
  return Array.from({ length: 16 }, (_, i): Vec4 => [
    (i & 1) ? 1 : -1,
    (i & 2) ? 1 : -1,
    (i & 4) ? 1 : -1,
    (i & 8) ? 1 : -1,
  ])
}

export function generateTesseractEdges(): [number, number][] {
  const edges: [number, number][] = []
  for (let i = 0; i < 16; i++) {
    for (let j = i + 1; j < 16; j++) {
      const diff = i ^ j
      if (diff !== 0 && (diff & (diff - 1)) === 0) {
        edges.push([i, j])
      }
    }
  }
  return edges  // exactly 32
}

export function rotateXW(v: Vec4, theta: number): Vec4 {
  const c = Math.cos(theta), s = Math.sin(theta)
  return [v[0]*c - v[3]*s, v[1], v[2], v[0]*s + v[3]*c]
}

export function rotateZW(v: Vec4, phi: number): Vec4 {
  const c = Math.cos(phi), s = Math.sin(phi)
  return [v[0], v[1], v[2]*c - v[3]*s, v[2]*s + v[3]*c]
}

export function project4Dto3D(v: Vec4, dist: number = PROJECTION_DISTANCE): Vec3 {
  const scale = dist / (dist - v[3])
  return [v[0]*scale, v[1]*scale, v[2]*scale]
}

export function transformVertex(v: Vec4, theta: number, phi: number): Vec3 {
  return project4Dto3D(rotateZW(rotateXW(v, theta), phi))
}
