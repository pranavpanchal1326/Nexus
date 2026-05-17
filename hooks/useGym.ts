'use client'
import {
  useQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query'
import { dispatchIslandEvent } from '@/lib/islandEvents'
import { playSound } from '@/lib/audio'
import { useInvalidateStats } from './useInvalidation'

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

export interface GymCreateResponse {
  log:             GymLog
  ai_insight:      string | null
  volume_delta:    number | null
  current_volume:  number
  previous_volume: number | null
}

export interface GymSession {
  date:      string
  logs:      GymLog[]
  exercises: string[]
  volume:    number
}

export const gymKeys = {
  all:        ['gym'] as const,
  logs:       () => [...gymKeys.all, 'logs'] as const,
  byExercise: (exercise?: string) =>
    [...gymKeys.logs(), { exercise }] as const,
  sessions:   () => [...gymKeys.all, 'sessions'] as const,
  exercises:  () => [...gymKeys.all, 'exercises'] as const,
}

export function useGymLogs(exercise?: string, limit = 50) {
  return useQuery<{ logs: GymLog[]; count: number }>({
    queryKey:  gymKeys.byExercise(exercise),
    queryFn:   async () => {
      const params = new URLSearchParams({ limit: String(limit) })
      if (exercise) params.set('exercise', exercise)
      const res = await fetch(`/api/gym?${params}`, { credentials: 'include' })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      return res.json()
    },
    staleTime: 2 * 60 * 1000,
    retry:     2,
  })
}

export function useGymSessions(limit = 10): {
  sessions: GymSession[]
  isLoading: boolean
} {
  const { data, isLoading } = useGymLogs(undefined, 100)
  const logs = data?.logs ?? []

  const sessionMap = new Map<string, GymLog[]>()
  logs.forEach(log => {
    const day = new Date(log.created_at).toDateString()
    if (!sessionMap.has(day)) sessionMap.set(day, [])
    sessionMap.get(day)!.push(log)
  })

  const sessions: GymSession[] = Array.from(sessionMap.entries())
    .slice(0, limit)
    .map(([date, dayLogs]) => ({
      date,
      logs:      dayLogs,
      exercises: [...new Set(dayLogs.map(l => l.exercise))],
      volume:    dayLogs.reduce(
        (sum, l) => sum + (l.sets * l.reps * (l.weight ?? 1)),
        0
      ),
    }))

  return { sessions, isLoading }
}

export function useExerciseList(): string[] {
  const { data } = useGymLogs(undefined, 200)
  const logs = data?.logs ?? []
  return [...new Set(logs.map(l => l.exercise))]
}

export function useExerciseHistory(exercise: string) {
  const { data } = useGymLogs(exercise, 30)
  const logs = data?.logs ?? []

  const volumeByDay = new Map<string, number>()
  logs.forEach(log => {
    const day = new Date(log.created_at).toDateString()
    const volume = log.sets * log.reps * (log.weight ?? 1)
    volumeByDay.set(day, (volumeByDay.get(day) ?? 0) + volume)
  })

  const trend = Array.from(volumeByDay.entries())
    .map(([date, volume]) => ({ date, volume }))
    .reverse()

  const latestVolume = trend[trend.length - 1]?.volume ?? 0
  const previousVolume = trend[trend.length - 2]?.volume ?? null
  const volumeDelta = previousVolume !== null
    ? latestVolume - previousVolume
    : null

  return { logs, trend, latestVolume, previousVolume, volumeDelta }
}

export function useLogGymSet() {
  const queryClient = useQueryClient()
  const invalidateStats = useInvalidateStats()

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
      queryClient.invalidateQueries({ queryKey: gymKeys.all })
      invalidateStats()

      playSound('gym-log')
      dispatchIslandEvent(
        'gym',
        `GYM LOGGED — ${data.log.exercise.toUpperCase()}`
      )
    },
  })
}

export function useGymStats() {
  const { data } = useGymLogs(undefined, 200)
  const logs = data?.logs ?? []

  const exercises = new Set(logs.map(l => l.exercise))
  const totalVolume = logs.reduce(
    (sum, l) => sum + (l.sets * l.reps * (l.weight ?? 1)),
    0
  )
  const totalSets = logs.reduce((sum, l) => sum + l.sets, 0)
  const sessionDates = new Set(
    logs.map(l => new Date(l.created_at).toDateString())
  )

  return {
    totalLogs:       logs.length,
    totalVolume,
    totalSets,
    uniqueExercises: exercises.size,
    totalSessions:   sessionDates.size,
  }
}
