import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'

interface ScenePerformanceMonitorProps {
  onQualityChange: (quality: 'high' | 'medium' | 'low') => void
  enabled:         boolean
}

const FPS_SAMPLE_SIZE  = 60   // Sample over 60 frames
const FPS_LOW_THRESHOLD    = 30   // Below 30fps → reduce quality
const FPS_MEDIUM_THRESHOLD = 45   // Below 45fps → medium quality
const FPS_RECOVERY_THRESHOLD = 55 // Above 55fps → attempt quality increase

export function ScenePerformanceMonitor({
  onQualityChange,
  enabled,
}: ScenePerformanceMonitorProps): null {
  const frameTimesRef   = useRef<number[]>([])
  const lastTimeRef     = useRef<number>(performance.now())
  const currentQuality  = useRef<'high' | 'medium' | 'low'>('high')
  const cooldownRef     = useRef<number>(0)   // frames to wait before next quality change

  useFrame(() => {
    if (!enabled) return

    const now      = performance.now()
    const delta    = now - lastTimeRef.current
    lastTimeRef.current = now

    // Track frame times — rolling window
    frameTimesRef.current.push(delta)
    if (frameTimesRef.current.length > FPS_SAMPLE_SIZE) {
      frameTimesRef.current.shift()
    }

    // Not enough samples yet
    if (frameTimesRef.current.length < FPS_SAMPLE_SIZE) return

    // Cooldown — don't thrash quality changes
    if (cooldownRef.current > 0) {
      cooldownRef.current--
      return
    }

    // Calculate average FPS from frame times
    const avgDelta = frameTimesRef.current.reduce((a, b) => a + b, 0) / FPS_SAMPLE_SIZE
    const fps      = 1000 / avgDelta

    const prev = currentQuality.current

    if (fps < FPS_LOW_THRESHOLD && prev !== 'low') {
      currentQuality.current = 'low'
      onQualityChange('low')
      cooldownRef.current = 120  // wait 120 frames before next check
    } else if (fps < FPS_MEDIUM_THRESHOLD && prev === 'high') {
      currentQuality.current = 'medium'
      onQualityChange('medium')
      cooldownRef.current = 120
    } else if (fps >= FPS_RECOVERY_THRESHOLD && prev !== 'high') {
      currentQuality.current = 'high'
      onQualityChange('high')
      cooldownRef.current = 180  // longer cooldown for upgrades — prevents oscillation
    }
  })

  return null  // This component renders nothing — pure behavior
}
