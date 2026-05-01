'use client'
import dynamic from 'next/dynamic'
import { WebGLCapabilityGate, SceneLoadingFallback } from './WebGLCapabilityGate'
import type { ReactNode } from 'react'

// Dynamic import — ssr: false is non-negotiable
// R3F uses browser APIs (WebGL, ResizeObserver) that do not exist server-side
const SceneCanvas = dynamic(
  () => import('./SceneCanvas').then(mod => ({ default: mod.SceneCanvas })),
  {
    ssr: false,
    loading: () => <SceneLoadingFallback />,
  }
)

interface SceneWrapperProps {
  children?: ReactNode
  className?: string
  /** Height of the scene container — defaults to 100% */
  height?: string | number
  /** Whether to show performance stats overlay in development */
  showStats?: boolean
}

export function SceneWrapper({
  children,
  className,
  height = '100%',
  showStats = false,
}: SceneWrapperProps): React.JSX.Element {
  return (
    <div
      className={`scene-wrapper ${className ?? ''}`}
      style={{ height, position: 'relative' }}
      aria-hidden="true"   // 3D is decorative — hidden from screen readers
      role="presentation"
    >
      <WebGLCapabilityGate>
        <SceneCanvas showStats={showStats}>
          {children}
        </SceneCanvas>
      </WebGLCapabilityGate>
    </div>
  )
}
