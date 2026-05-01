import { useEffect, useRef } from 'react'
import { useThree, useFrame } from '@react-three/fiber'
import { FogExp2, Color } from 'three'
import { useNexusStore } from '@/store/nexusStore'

// Fog density per mode
const FOG_DENSITY = {
  apex:  0.08,   // Sharper — less fog — Commander clarity
  haven: 0.14,   // Denser — more atmospheric — Poet warmth
} as const

// Background color — always void black
const SCENE_BACKGROUND = new Color('#080808')

export function SceneEnvironment(): React.JSX.Element {
  const { scene } = useThree()
  const mode       = useNexusStore(state => state.mode)
  const fogRef     = useRef<FogExp2 | null>(null)
  const targetDensityRef = useRef<number>(FOG_DENSITY.apex)

  // Initialize scene
  useEffect((): (() => void) => {
    scene.background = SCENE_BACKGROUND

    const fog = new FogExp2('#080808', FOG_DENSITY.apex)
    scene.fog = fog
    fogRef.current = fog

    return () => {
      scene.fog        = null
      scene.background = null
    }
  }, [scene])

  // React to mode changes — update target density
  useEffect((): void => {
    targetDensityRef.current = FOG_DENSITY[mode]
  }, [mode])

  // Lerp fog density toward target on each frame — smooth mode transition
  useFrame((): void => {
    if (!fogRef.current) return
    const current = fogRef.current.density
    const target  = targetDensityRef.current
    if (Math.abs(current - target) > 0.0001) {
      fogRef.current.density += (target - current) * 0.02
    }
  })

  return (
    <>
      {/* Ambient light — low intensity, scene-wide */}
      {/* @ts-ignore */}
      <ambientLight intensity={0.4} color="#ffffff" />

      {/* Single directional light — top-left, cold */}
      {/* @ts-ignore */}
      <directionalLight
        position={[2, 4, 2]}
        intensity={0.6}
        color="#c8d8ff"
      />
    </>
  )
}
