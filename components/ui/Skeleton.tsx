'use client'

// ─── Types ────────────────────────────────────────────────────────────────────

type SkeletonVariant = 'line' | 'block' | 'circle' | 'card'

interface SkeletonProps {
  variant?:   SkeletonVariant
  width?:     string | number
  height?:    string | number
  className?: string
  /** Delay shimmer start — for staggered skeleton lists */
  delay?:     number
}

// ─── Base Skeleton ────────────────────────────────────────────────────────────

export function Skeleton({
  variant   = 'line',
  width     = '100%',
  height,
  className,
  delay     = 0,
}: SkeletonProps) {
  const defaultHeights: Record<SkeletonVariant, string> = {
    line:   '12px',
    block:  '48px',
    circle: '32px',
    card:   '120px',
  }

  const resolvedHeight = height ?? defaultHeights[variant]
  const borderRadius   = variant === 'circle' ? '50%' : variant === 'line' ? '4px' : '8px'

  return (
    <div
      className={`skeleton skeleton--${variant} ${className ?? ''}`}
      style={{
        width,
        height:            typeof resolvedHeight === 'number' ? `${resolvedHeight}px` : resolvedHeight,
        borderRadius,
        animationDelay:    `${delay}ms`,
        flexShrink:        0,
      }}
      aria-hidden="true"
    />
  )
}

// ─── Skeleton Group — staggered lines ────────────────────────────────────────

interface SkeletonLinesProps {
  count?:     number
  /** Per-line widths — creates natural variation */
  widths?:    (string | number)[]
  gap?:       number
  className?: string
}

export function SkeletonLines({
  count  = 3,
  widths = ['100%', '80%', '60%'],
  gap    = 8,
  className,
}: SkeletonLinesProps) {
  return (
    <div
      className={`skeleton-group ${className ?? ''}`}
      style={{ display: 'flex', flexDirection: 'column', gap }}
      aria-hidden="true"
    >
      {Array.from({ length: count }, (_, i) => (
        <Skeleton
          key={i}
          variant="line"
          width={widths[i % widths.length]}
          delay={i * 40}
        />
      ))}
    </div>
  )
}

// ─── Feed Skeleton — mirrors IntelPanel feed item ─────────────────────────────

export function FeedItemSkeleton() {
  return (
    <div className="feed-skeleton" aria-hidden="true">
      <Skeleton variant="line" width="30%" height="8px"  delay={0}   />
      <Skeleton variant="line" width="90%" height="10px" delay={40}  />
      <Skeleton variant="line" width="70%" height="10px" delay={80}  />
      <Skeleton variant="line" width="25%" height="8px"  delay={120} />
    </div>
  )
}

// ─── Stat Skeleton — mirrors OdometerNumber display ──────────────────────────

export function StatSkeleton() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }} aria-hidden="true">
      <Skeleton variant="line" width="40%" height="32px" />
      <Skeleton variant="line" width="60%" height="10px" />
    </div>
  )
}

// ─── Card Skeleton — mirrors full card ───────────────────────────────────────

export function CardSkeleton({ padding = 20 }: { padding?: number }) {
  return (
    <div className="card" style={{ padding }} aria-hidden="true">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <Skeleton variant="line" width="40%" height="10px" delay={0}   />
        <Skeleton variant="line" width="60%" height="28px" delay={60}  />
        <Skeleton variant="line" width="80%" height="10px" delay={120} />
        <Skeleton variant="line" width="55%" height="10px" delay={180} />
      </div>
    </div>
  )
}
