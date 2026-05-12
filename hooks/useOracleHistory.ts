'use client'
import { useCallback } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'

export function useOracleHistory() {
  const queryClient = useQueryClient()

  // Clear history mutation
  const clearMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/chat/clear', {
        method:      'DELETE',
        credentials: 'include',
      })
      if (!res.ok) throw new Error('Failed to clear history')
      return res.json()
    },
    onSuccess: () => {
      // Invalidate any cached history queries
      queryClient.invalidateQueries({ queryKey: ['oracle-history'] })
    },
  })

  const clearHistory = useCallback(async () => {
    await clearMutation.mutateAsync()
  }, [clearMutation])

  return {
    clearHistory,
    isClearing: clearMutation.isPending,
  }
}
