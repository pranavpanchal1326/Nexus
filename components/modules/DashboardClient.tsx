'use client'
import { motion } from 'framer-motion'
import { SceneWrapper } from '@/components/three/SceneWrapper'
import { Tesseract } from '@/components/three/Tesseract'
import { AuroraField } from '@/components/three/AuroraField'
import { Heatmap } from '@/components/modules/Heatmap'
import { ArtifactModule } from '@/components/modules/ArtifactModule'
import { DashboardAmbientIntel } from '@/components/modules/AmbientIntel'
import { StatCard } from '@/components/modules/StatCard'
import { DataErrorBoundary } from '@/components/providers/ErrorBoundary'
import { useStats } from '@/hooks/useStats'
import { useDashboardAmbient } from '@/hooks/useAmbientAI'
import { usePrefetchStats } from '@/hooks/useInvalidation'
import { useNexusStore } from '@/store/nexusStore'
import { STAGGER_CONTAINER_VARIANTS, CARD_REVEAL_VARIANTS } from '@/lib/motion'
import { useEffect } from 'react'

interface DashboardClientProps {
  userId: string
  initialStreak: number
  initialXP: number
  displayName: string | null
}

export function DashboardClient({
  userId: _userId,
  initialStreak,
  initialXP,
  displayName,
}: DashboardClientProps) {
  const mode = useNexusStore(state => state.mode)
  const prefetch = usePrefetchStats()

  useEffect(() => {
    prefetch()
  }, [prefetch])

  const { data: stats, isLoading } = useStats()
  const { insight: ambientInsight } = useDashboardAmbient(stats)

  return (
    <div className="dashboard-page">
      <div className="dashboard-aurora-bg" aria-hidden="true">
        <SceneWrapper height="100%">
          <AuroraField zPosition={-2} planeScale={12} />
        </SceneWrapper>
      </div>

      <motion.div
        className="dashboard-content"
        variants={STAGGER_CONTAINER_VARIANTS}
        initial="hidden"
        animate="visible"
      >
        {displayName && (
          <motion.div
            className="dashboard-welcome"
            variants={CARD_REVEAL_VARIANTS}
          >
            <span className="dashboard-welcome__greeting text-label">
              {mode === 'apex' ? 'SYSTEM READY' : 'WELCOME BACK'}
            </span>
            <h1 className="dashboard-welcome__name text-display">
              {displayName}
            </h1>
          </motion.div>
        )}

        <motion.section
          className="dashboard-tesseract-zone"
          variants={CARD_REVEAL_VARIANTS}
          aria-hidden="true"
        >
          <SceneWrapper
            height={400}
            showStats={process.env.NODE_ENV === 'development'}
          >
            <AuroraField zPosition={-1} planeScale={8} />
            <Tesseract scale={1.2} showInnerCube={true} />
          </SceneWrapper>
        </motion.section>

        <motion.div variants={CARD_REVEAL_VARIANTS}>
          <DataErrorBoundary module="stats">
            <ArtifactModule
              initialStreak={initialStreak}
              initialXP={initialXP}
            />
          </DataErrorBoundary>
        </motion.div>

        <motion.div
          className="dashboard-stat-grid"
          variants={STAGGER_CONTAINER_VARIANTS}
        >
          <motion.div variants={CARD_REVEAL_VARIANTS}>
            <StatCard
              label="JOURNAL"
              value={stats?.journal_count ?? 0}
              unit="entries"
              href="/journal"
              isLoading={isLoading}
            />
          </motion.div>
          <motion.div variants={CARD_REVEAL_VARIANTS}>
            <StatCard
              label="GYM"
              value={stats?.gym_count ?? 0}
              unit="sessions"
              href="/gym"
              isLoading={isLoading}
            />
          </motion.div>
          <motion.div variants={CARD_REVEAL_VARIANTS}>
            <StatCard
              label="LEXICON"
              value={stats?.duel_count ?? 0}
              unit="duels"
              href="/lexicon"
              isLoading={isLoading}
            />
          </motion.div>
          <motion.div variants={CARD_REVEAL_VARIANTS}>
            <StatCard
              label="ORACLE"
              value={stats?.oracle_count ?? 0}
              unit="sessions"
              href="/oracle"
              isLoading={isLoading}
            />
          </motion.div>
        </motion.div>

        <motion.div variants={CARD_REVEAL_VARIANTS}>
          <DataErrorBoundary module="stats">
            <Heatmap data={stats?.heatmap ?? []} isLoading={isLoading} />
          </DataErrorBoundary>
        </motion.div>

        <DashboardAmbientIntel insight={ambientInsight} />
      </motion.div>
    </div>
  )
}
