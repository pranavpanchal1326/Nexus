'use client'
import { useRouter } from 'next/navigation'
import { useKeyboard, NEXUS_SHORTCUTS } from '@/hooks/useKeyboard'
import { useNexusStore } from '@/store/nexusStore'
import { playSound } from '@/lib/audio'
import { useAudio } from '@/hooks/useAudio'

/**
 * Pure behavior component — registers all global NEXUS keyboard shortcuts.
 * Mounts once inside the dashboard layout. Returns null.
 */
export function DashboardShortcuts() {
  const router      = useRouter()
  const toggleIntel = useNexusStore(state => state.toggleIntelPanel)
  const { toggleMute } = useAudio()

  useKeyboard([
    {
      ...NEXUS_SHORTCUTS.ORACLE,
      handler: () => {
        playSound('oracle-start')
        router.push('/oracle')
      },
    },
    {
      ...NEXUS_SHORTCUTS.JOURNAL,
      handler: () => {
        router.push('/journal')
      },
    },
    {
      ...NEXUS_SHORTCUTS.DASHBOARD,
      handler: () => {
        router.push('/dashboard')
      },
    },
    {
      ...NEXUS_SHORTCUTS.TOGGLE_INTEL,
      handler: () => {
        toggleIntel()
      },
    },
    {
      ...NEXUS_SHORTCUTS.TOGGLE_MUTE,
      handler: () => {
        toggleMute()
      },
    },
  ])

  return null
}
