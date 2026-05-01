'use client'
import { useQuery } from '@tanstack/react-query'

export interface StatsData {
  current_streak:  number
  longest_streak:  number
  cognitive_xp:    number
  journal_count:   number
  gym_count:       number
  duel_count:      number
  oracle_count:    number
  heatmap: {
    date:  string   // ISO date string "2026-01-15"
    count: number   // 0–4 activity level
  }[]
  recent_activity: {
    type:       'journal' | 'gym' | 'duel' | 'oracle'
    preview:    string
    created_at: string
  }[]
}

import { UseQueryResult } from '@tanstack/react-query';
export function useStats(): UseQueryResult<StatsData, Error> {
  return useQuery<StatsData>({
    queryKey: ['stats'],
    queryFn: async () => {
      const res = await fetch('/api/stats', { credentials: 'include' })
      if (!res.ok) throw new Error('Failed to fetch stats')
      return res.json()
    },
    staleTime:           5 * 60 * 1000,   // 5 minutes
    refetchInterval:     30 * 1000,        // poll every 30s — IntelPanel stays live
    refetchOnWindowFocus: true,
    retry:               2,
    select: (data) => data,               // transform hook point — add derived fields later
  })
}
