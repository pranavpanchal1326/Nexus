// ─── Core UI Primitives ───────────────────────────────────────────────────────
export { Button }                                              from './Button'
export { Card }                                                from './Card'
export { Input }                                               from './Input'
export { Modal }                                               from './Modal'
export { Badge }                                               from './Badge'
export { SignalDot }                                           from './SignalDot'
export { OdometerNumber }                                      from './OdometerNumber'
export { Tooltip }                                             from './Tooltip'
export { Divider }                                             from './Divider'

// ─── Skeleton System ──────────────────────────────────────────────────────────
export {
  Skeleton,
  SkeletonLines,
  FeedItemSkeleton,
  StatSkeleton,
  CardSkeleton,
}                                                              from './Skeleton'

// ─── State Components ─────────────────────────────────────────────────────────
export { EmptyState }                                          from './EmptyState'
export { type EmptyStateModule, EMPTY_STATE_COPY }             from './EmptyState'

// ─── Layout Utilities ─────────────────────────────────────────────────────────
export { PageWrapper }                                         from './PageWrapper'
export { ScrollArea }                                          from './ScrollArea'

// ─── Inline Indicators ────────────────────────────────────────────────────────
export { ModeIndicator }                                       from './ModeIndicator'
export { Kbd, Shortcut }                                       from './Kbd'

// ─── Physics Wrappers — re-exported from physics/ ─────────────────────────────
export { ApexSpring, ApexButton, ApexCard }                    from '../physics/ApexSpring'
export { HavenSpring, HavenButton, HavenCard }                 from '../physics/HavenSpring'
export { ModeSpring, ModeButton, ModeCard }                    from '../physics/ModeSpring'
