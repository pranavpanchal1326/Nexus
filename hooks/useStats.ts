'use client'
import { useQuery } from '@tanstack/react-query'
import { useEffect, useRef } from 'react'
import { playSound } from '@/lib/audio'
import { dispatchIslandEvent } from '@/lib/islandEvents'

export interface HeatmapDay {
  date:  string
  count: number
}

export interface RecentActivity {
  type:       'journal' | 'gym' | 'duel' | 'oracle'
  preview:    string
  created_at: string
}

export interface StatsData {
  current_streak:  number
  longest_streak:  number
  cognitive_xp:    number
  journal_count:   number
  gym_count:       number
  duel_count:      number
  oracle_count:    number
  heatmap:         HeatmapDay[]
  recent_activity: RecentActivity[]
}

const STREAK_MILESTONES = [7, 30, 100, 365]

export const statsKeys = {
  all:  ['stats'] as const,
  data: () => [...statsKeys.all, 'data'] as const,
}

export function useStats() {
  const prevStreakRef = useRef<number | null>(null)

  const query = useQuery<StatsData>({
    queryKey:        statsKeys.data(),
    queryFn:         async () => {
      const res = await fetch('/api/stats', { credentials: 'include' })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      return res.json()
    },
    staleTime:       5 * 60 * 1000,
    refetchInterval: 60 * 1000,
    refetchOnWindowFocus: true,
    retry:           2,
  })

  useEffect(() => {
    const streak = query.data?.current_streak
    if (streak === undefined) return

    const prev = prevStreakRef.current
    prevStreakRef.current = streak

    if (prev !== null && streak !== prev) {
      const hitMilestone = STREAK_MILESTONES.some(
        m => streak >= m && (prev < m)
      )
      if (hitMilestone) {
        playSound('streak-milestone')
        dispatchIslandEvent('oracle', `${streak} DAY STREAK ACHIEVED`)
      }
    }
  }, [query.data?.current_streak])

  const derived = query.data
    ? {
        totalActivity: query.data.journal_count +
          query.data.gym_count +
          query.data.duel_count +
          query.data.oracle_count,
        streakPercentOfBest: query.data.longest_streak > 0
          ? Math.round(
              (query.data.current_streak / query.data.longest_streak) * 100
            )
          : 0,
        isAtPersonalBest:
          query.data.current_streak > 0 &&
          query.data.current_streak >= query.data.longest_streak,
        nextMilestone: STREAK_MILESTONES.find(
          m => m > (query.data?.current_streak ?? 0)
        ) ?? null,
        daysToNextMilestone: (() => {
          const next = STREAK_MILESTONES.find(
            m => m > (query.data?.current_streak ?? 0)
          )
          return next ? next - (query.data?.current_streak ?? 0) : null
        })(),
      }
    : null

  return { ...query, derived }
}

export function useHeatmapData() {
  const { data } = useStats()
  return data?.heatmap ?? []
}

export function useRecentActivity(limit = 10) {
  const { data } = useStats()
  return (data?.recent_activity ?? []).slice(0, limit)
}
