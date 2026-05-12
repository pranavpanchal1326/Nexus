'use client'
import { useStats }              from '@/hooks/useStats'
import { useDashboardAmbient }   from '@/hooks/useAmbientAI'
import { DashboardAmbientIntel } from '@/components/modules/AmbientIntel'

export function DashboardClient() {
  const { data: stats } = useStats()
  const { insight }     = useDashboardAmbient(stats)

  return (
    <section className="dashboard-stats-zone">
      {/* Heatmap renders here — Phase 6C */}
      {/* Ambient insight appears below heatmap */}
      <DashboardAmbientIntel insight={insight} />
    </section>
  )
}
