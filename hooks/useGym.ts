'use client'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { dispatchIslandEvent }                    from '@/lib/islandEvents'
import { playSound }                              from '@/lib/audio'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface GymLog {
  id:           string
  exercise:     string
  sets:         number
  reps:         number
  weight:       number | null
  unit:         'kg' | 'lbs'
  notes:        string | null
  volume_delta: number | null
  created_at:   string
}

export interface GymLogCreate {
  exercise: string
  sets:     number
  reps:     number
  weight?:  number
  unit:     'kg' | 'lbs'
  notes?:   string
}

interface GymCreateResponse {
  log:              GymLog
  ai_insight:       string | null
  volume_delta:     number | null
  current_volume:   number
  previous_volume:  number | null
}

// ─── Queries ──────────────────────────────────────────────────────────────────

export function useGymLogs(exercise?: string, limit = 30) {
  return useQuery<{ logs: GymLog[]; count: number }>({
    queryKey:  ['gym', 'logs', exercise, limit],
    queryFn:   async () => {
      const params = new URLSearchParams({ limit: String(limit) })
      if (exercise) params.set('exercise', exercise)
      const res = await fetch(`/api/gym?${params}`, { credentials: 'include' })
      if (!res.ok) throw new Error('Failed to fetch gym logs')
      return res.json()
    },
    staleTime: 2 * 60 * 1000,
    retry:     2,
  })
}

// Get unique exercises from history
export function useExerciseList() {
  const { data } = useGymLogs(undefined, 100)
  const exercises = data?.logs
    ? [...new Set(data.logs.map(l => l.exercise))]
    : []
  return exercises
}

// ─── Mutations ────────────────────────────────────────────────────────────────

export function useLogGymSet() {
  const queryClient = useQueryClient()

  return useMutation<GymCreateResponse, Error, GymLogCreate>({
    mutationFn: async (payload) => {
      const res = await fetch('/api/gym', {
        method:      'POST',
        headers:     { 'Content-Type': 'application/json' },
        credentials: 'include',
        body:        JSON.stringify(payload),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Log failed' }))
        throw new Error(err.error)
      }
      return res.json()
    },

    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['gym'] })
      queryClient.invalidateQueries({ queryKey: ['stats'] })

      playSound('gym-log')
      dispatchIslandEvent(
        'gym',
        `GYM LOGGED — ${data.log.exercise.toUpperCase()}`
      )
    },
  })
}
