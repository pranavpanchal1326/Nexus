'use client'
import { useQueryClient } from '@tanstack/react-query'
import { useCallback } from 'react'
import { statsKeys } from './useStats'
import { journalKeys } from './useJournal'
import { gymKeys } from './useGym'
import { lexiconKeys } from './useLexicon'

export function useInvalidateStats(): () => void {
  const queryClient = useQueryClient()
  return useCallback(() => {
    queryClient.invalidateQueries({ queryKey: statsKeys.all })
  }, [queryClient])
}

export function useInvalidateAll(): () => void {
  const queryClient = useQueryClient()
  return useCallback(() => {
    queryClient.invalidateQueries({ queryKey: journalKeys.all })
    queryClient.invalidateQueries({ queryKey: gymKeys.all })
    queryClient.invalidateQueries({ queryKey: lexiconKeys.all })
    queryClient.invalidateQueries({ queryKey: statsKeys.all })
  }, [queryClient])
}

export function usePrefetchStats(): () => Promise<void> {
  const queryClient = useQueryClient()
  return useCallback(async () => {
    await queryClient.prefetchQuery({
      queryKey: statsKeys.data(),
      queryFn:  async () => {
        const res = await fetch('/api/stats', { credentials: 'include' })
        if (!res.ok) throw new Error('Prefetch failed')
        return res.json()
      },
      staleTime: 5 * 60 * 1000,
    })
  }, [queryClient])
}
