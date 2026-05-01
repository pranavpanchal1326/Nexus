'use client'
import { Canvas, type RootState } from '@react-three/fiber'
import { Suspense, useCallback, useState } from 'react'
import { SceneErrorBoundary } from './SceneErrorBoundary'
import { ScenePerformanceMonitor } from './ScenePerformanceMonitor'
import { SceneEnvironment } from './SceneEnvironment'
import { SceneStatsOverlay } from './SceneStatsOverlay'
import type { ReactNode } from 'react'

interface SceneCanvasProps {
  children: ReactNode
  showStats: boolean
}

export function SceneCanvas({ children, showStats }: SceneCanvasProps) {
  const [quality, setQuality] = useState<'high' | 'medium' | 'low'>('high')

  const handleCreated = useCallback((state: RootState) => {
    const { gl } = state

    // Cap DPR at 2 — no 3x rendering on high-density displays
    gl.setPixelRatio(Math.min(window.devicePixelRatio, 2))

    // Optimize WebGL state
    // @ts-ignore - fiber types might mismatch slightly with three versions
    gl.shadowMap.enabled = false        // NEXUS has no shadows
    
    // Context loss recovery
    const canvas = gl.domElement
    canvas.addEventListener('webglcontextlost', (e) => {
      e.preventDefault()
      console.warn('[NEXUS] WebGL context lost — attempting recovery')
    })
    canvas.addEventListener('webglcontextrestored', () => {
      console.info('[NEXUS] WebGL context restored')
    })
  }, [])

  const dpr: [number, number] = quality === 'high'
    ? [1, 2]
    : quality === 'medium'
    ? [1, 1.5]
    : [1, 1]

  return (
    <SceneErrorBoundary>
      <Canvas
        dpr={dpr}
        gl={{
          antialias:              quality !== 'low',
          alpha:                  true,
          powerPreference:        'high-performance',
          failIfMajorPerformanceCaveat: false,
          preserveDrawingBuffer:  false,
        }}
        camera={{
          position: [0, 0, 5],
          fov:      50,
          near:     0.1,
          far:      100,
        }}
        style={{
          pointerEvents: 'none',  // 3D is ambient — never interactive
          position:      'absolute',
          inset:         0,
        }}
        onCreated={handleCreated}
        frameloop="always"
        flat={true}             // No tone mapping — raw colors match design system
      >
        <Suspense fallback={null}>
          <SceneEnvironment />
          <ScenePerformanceMonitor
            onQualityChange={setQuality}
            enabled={true}
          />
          {children}
        </Suspense>

        {/* Dev stats — performance overlay */}
        {showStats && process.env.NODE_ENV === 'development' && (
          <SceneStatsOverlay />
        )}
      </Canvas>
    </SceneErrorBoundary>
  )
}
