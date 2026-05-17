'use client'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { OdometerNumber, Skeleton } from '@/components/ui'
import { SPRING } from '@/lib/motion'
import { useNexusStore } from '@/store/nexusStore'

interface StatCardProps {
  label: string
  value: number
  unit: string
  href: string
  isLoading: boolean
  delta?: number
}

export function StatCard({
  label,
  value,
  unit,
  href,
  isLoading,
  delta,
}: StatCardProps) {
  const mode = useNexusStore(state => state.mode)
  const isApex = mode === 'apex'

  return (
    <Link href={href} className="stat-card-link">
      <motion.div
        className="stat-card card card--interactive card--pad-md"
        whileHover={isApex
          ? { y: -3, transition: SPRING.SNAP }
          : { scale: 1.008, transition: SPRING.FLOAT }
        }
        whileTap={{ scale: 0.99 }}
        transition={isApex ? SPRING.SNAP : SPRING.FLOAT}
      >
        <span className="stat-card__label text-label">{label}</span>

        <div className="stat-card__value-row">
          {isLoading ? (
            <Skeleton variant="block" width={48} height={36} />
          ) : (
            <OdometerNumber
              value={value}
              className="stat-card__value"
            />
          )}

          {delta !== undefined && delta !== 0 && !isLoading && (
            <span
              className="stat-card__delta"
              style={{
                color: delta > 0
                  ? 'var(--color-success)'
                  : 'var(--color-error)',
              }}
            >
              {delta > 0 ? '+' : ''}{delta}
            </span>
          )}
        </div>

        <span className="stat-card__unit text-caption">{unit}</span>
      </motion.div>
    </Link>
  )
}
