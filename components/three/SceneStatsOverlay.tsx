import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Html } from '@react-three/drei'

export function SceneStatsOverlay() {
  const fpsRef       = useRef<number>(60)
  const frameCount   = useRef<number>(0)
  const lastTimeRef  = useRef<number>(performance.now())
  const domRef       = useRef<HTMLDivElement | null>(null)

  useFrame(() => {
    frameCount.current++
    const now   = performance.now()
    const delta = now - lastTimeRef.current

    if (delta >= 1000) {
      fpsRef.current    = Math.round((frameCount.current * 1000) / delta)
      frameCount.current = 0
      lastTimeRef.current = now

      if (domRef.current) {
        const fps = fpsRef.current
        domRef.current.textContent = `${fps} FPS`
        domRef.current.style.color = fps >= 50
          ? '#4ADE80'
          : fps >= 30
          ? '#F59E0B'
          : '#FF4444'
      }
    }
  })

  return (
    <Html
      position={[-4.5, 3, 0]}
      style={{ pointerEvents: 'none' }}
    >
      <div
        ref={domRef}
        style={{
          fontFamily:    'var(--font-mono)',
          fontSize:      '10px',
          letterSpacing: '0.08em',
          color:         '#4ADE80',
          background:    'rgba(0,0,0,0.6)',
          padding:       '3px 6px',
          borderRadius:  '4px',
          userSelect:    'none',
          whiteSpace:    'nowrap',
        }}
      >
        60 FPS
      </div>
    </Html>
  )
}
