'use client'
import { useState, useEffect, type ReactNode } from 'react'

interface WebGLCapabilityGateProps {
  children: ReactNode
}

type WebGLStatus = 'detecting' | 'supported' | 'unsupported'

function detectWebGL2(): boolean {
  try {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('webgl2')
    if (!ctx) return false

    // Verify minimum capabilities NEXUS requires
    ctx.getExtension('EXT_color_buffer_float')
    const maxTextures = ctx.getParameter(ctx.MAX_TEXTURE_IMAGE_UNITS)

    // Clean up test canvas
    const loseCtx = ctx.getExtension('WEBGL_lose_context')
    loseCtx?.loseContext()

    return maxTextures >= 8
  } catch {
    return false
  }
}

export function WebGLCapabilityGate({ children }: WebGLCapabilityGateProps) {
  const [status, setStatus] = useState<WebGLStatus>('detecting')

  useEffect(() => {
    // Detection must run client-side only
    const supported = detectWebGL2()
    setStatus(supported ? 'supported' : 'unsupported')
  }, [])

  if (status === 'detecting') {
    return <SceneLoadingFallback />
  }

  if (status === 'unsupported') {
    return <SceneUnsupportedFallback />
  }

  return <>{children}</>
}

// ─── Fallback components ──────────────────────────────────────────────────────

export function SceneLoadingFallback() {
  return (
    <div className="scene-fallback scene-fallback--loading">
      {/* Subtle animated placeholder — not a spinner, not text */}
      {/* Single signal dot pulse — consistent with system language */}
      <div className="scene-loading-dot" />
    </div>
  )
}

function SceneUnsupportedFallback() {
  return (
    <div className="scene-fallback scene-fallback--unsupported">
      {/* Static geometric placeholder — ASCII tesseract suggestion */}
      <div className="scene-unsupported-geo" aria-hidden="true">
        <span className="scene-unsupported-char">◇</span>
      </div>
    </div>
  )
}
