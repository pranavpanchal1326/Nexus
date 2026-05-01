'use client'
import { useRef, useMemo, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import {
  BufferGeometry,
  BufferAttribute,
  LineSegments,
  LineBasicMaterial,
  Color,
  AdditiveBlending,
} from 'three'
import { useNexusStore } from '@/store/nexusStore'
import type { Mode } from '@/types/mode'
import {
  generateTesseractVertices,
  generateTesseractEdges,
  transformVertex,
} from '@/lib/tesseract-math'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface TesseractProps {
  scale?:          number
  showInnerCube?:  boolean
  modeOverride?:   Mode | 'default'
}

// ─── Constants ────────────────────────────────────────────────────────────────

const RPM_TO_RPS = (2 * Math.PI) / 60

const ROTATION_SPEEDS: Record<'apex' | 'haven' | 'default', number> = {
  apex:    0.8  * RPM_TO_RPS,
  haven:   0.15 * RPM_TO_RPS,
  default: 0.3  * RPM_TO_RPS,
}

const GOLDEN_RATIO         = 0.618033988749895
const SPEED_LERP_FACTOR    = 0.02   // ~2s transition at 60fps

const MODE_VISUAL: Record<'apex' | 'haven' | 'default', {
  outer: string
  inner: string
  outerOpacity: number
  innerOpacity: number
}> = {
  apex: {
    outer:        '#22D3EE',
    inner:        '#22D3EE',
    outerOpacity: 0.85,
    innerOpacity: 0.25,
  },
  haven: {
    outer:        '#C4A882',
    inner:        '#C4A882',
    outerOpacity: 0.6,
    innerOpacity: 0.15,
  },
  default: {
    outer:        '#888888',
    inner:        '#888888',
    outerOpacity: 0.5,
    innerOpacity: 0.12,
  },
}

// ─── Component ────────────────────────────────────────────────────────────────

export function Tesseract({
  scale        = 1.2,
  showInnerCube = true,
  modeOverride,
}: TesseractProps) {
  const storeMode    = useNexusStore(state => state.mode)
  const resolvedMode: 'apex' | 'haven' | 'default' = (modeOverride ?? storeMode) as any

  // Rotation state
  const thetaRef        = useRef(0)
  const phiRef          = useRef(0)
  const currentSpeedRef = useRef(ROTATION_SPEEDS.default)
  const targetSpeedRef  = useRef(ROTATION_SPEEDS[resolvedMode])

  // Static geometry data — computed once
  const { vertices, edges } = useMemo(() => ({
    vertices: generateTesseractVertices(),
    edges:    generateTesseractEdges(),
  }), [])

  // Geometry buffers — mutated in place each frame
  const outerGeo = useRef(new BufferGeometry())
  const innerGeo = useRef(new BufferGeometry())

  // Preallocate Float32Arrays — avoids GC pressure from per-frame allocation
  const outerPositions = useRef(new Float32Array(edges.length * 6))
  const innerPositions = useRef(new Float32Array(edges.length * 6))

  // Initialize buffer attributes
  useEffect(() => {
    outerGeo.current.setAttribute('position', new BufferAttribute(outerPositions.current, 3))
    innerGeo.current.setAttribute('position', new BufferAttribute(innerPositions.current, 3))
  }, [])  // eslint-disable-line react-hooks/exhaustive-deps

  // Materials
  const outerMat = useRef(new LineBasicMaterial({
    color:       new Color(MODE_VISUAL[resolvedMode].outer),
    transparent: true,
    opacity:     MODE_VISUAL[resolvedMode].outerOpacity,
    blending:    AdditiveBlending,
    depthWrite:  false,
  }))

  const innerMat = useRef(new LineBasicMaterial({
    color:       new Color(MODE_VISUAL[resolvedMode].inner),
    transparent: true,
    opacity:     MODE_VISUAL[resolvedMode].innerOpacity,
    blending:    AdditiveBlending,
    depthWrite:  false,
  }))

  // Stable LineSegments objects — never recreated
  const outerMesh = useRef(new LineSegments(outerGeo.current, outerMat.current))
  const innerMesh = useRef(new LineSegments(innerGeo.current, innerMat.current))

  // React to mode changes
  useEffect(() => {
    const v = MODE_VISUAL[resolvedMode]
    targetSpeedRef.current = ROTATION_SPEEDS[resolvedMode]

    outerMat.current.color.set(v.outer)
    outerMat.current.opacity      = v.outerOpacity
    innerMat.current.color.set(v.inner)
    innerMat.current.opacity      = v.innerOpacity
    outerMat.current.needsUpdate  = true
    innerMat.current.needsUpdate  = true
  }, [resolvedMode])

  // Dispose on unmount
  useEffect(() => {
    const og = outerGeo.current
    const ig = innerGeo.current
    const om = outerMat.current
    const im = innerMat.current
    return () => { og.dispose(); ig.dispose(); om.dispose(); im.dispose() }
  }, [])

  useFrame((_, delta) => {
    // Clamp delta — prevents large jumps when tab is backgrounded
    const dt = Math.min(delta, 0.05)

    // Lerp speed
    currentSpeedRef.current +=
      (targetSpeedRef.current - currentSpeedRef.current) * SPEED_LERP_FACTOR

    // Advance angles
    thetaRef.current += currentSpeedRef.current * dt
    phiRef.current   += currentSpeedRef.current * dt * GOLDEN_RATIO

    const theta = thetaRef.current
    const phi   = phiRef.current

    // Project all 16 vertices
    const projected = vertices.map(v => transformVertex(v, theta, phi))

    // Write edge positions into preallocated buffers
    const outerBuf = outerPositions.current
    const innerBuf = innerPositions.current

    edges.forEach(([aIdx, bIdx], i) => {
      const a        = projected[aIdx]
      const b        = projected[bIdx]
      const isOuter  = (vertices[aIdx][3] === vertices[bIdx][3])
      const buf      = isOuter ? outerBuf : innerBuf
      const offset   = i * 6

      buf[offset + 0] = a[0] * scale
      buf[offset + 1] = a[1] * scale
      buf[offset + 2] = a[2] * scale
      buf[offset + 3] = b[0] * scale
      buf[offset + 4] = b[1] * scale
      buf[offset + 5] = b[2] * scale
    })

    // Signal buffer updates to GPU
    const outerAttr = outerGeo.current.attributes.position as BufferAttribute
    const innerAttr = innerGeo.current.attributes.position as BufferAttribute

    if (outerAttr) outerAttr.needsUpdate = true
    if (innerAttr && showInnerCube) innerAttr.needsUpdate = true

    outerGeo.current.computeBoundingSphere()
    if (showInnerCube) innerGeo.current.computeBoundingSphere()
  })

  return (
    // @ts-ignore
    <group>
      {/* @ts-ignore */}
      <primitive object={outerMesh.current} />
      {/* @ts-ignore */}
      {showInnerCube && <primitive object={innerMesh.current} />}
    {/* @ts-ignore */}
    </group>
  )
}
