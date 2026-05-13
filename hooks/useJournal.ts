'use client'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNexusStore }                          from '@/store/nexusStore'
import { dispatchIslandEvent }                    from '@/lib/islandEvents'
import { playSound }                              from '@/lib/audio'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface JournalEntry {
  id:         string
  content:    string
  mode:       'apex' | 'haven'
  word_count: number
  ai_insight: string | null
  created_at: string
}

interface JournalListResponse {
  entries: JournalEntry[]
  total:   number
  offset:  number
  limit:   number
}

// ─── Queries ──────────────────────────────────────────────────────────────────

export function useJournalList(limit = 20) {
  return useQuery<JournalListResponse>({
    queryKey:    ['journal', 'list', limit],
    queryFn:     async () => {
      const res = await fetch(
        `/api/journal?limit=${limit}&offset=0`,
        { credentials: 'include' }
      )
      if (!res.ok) throw new Error('Failed to fetch journal entries')
      return res.json()
    },
    staleTime:   2 * 60 * 1000,
    retry:       2,
  })
}

// ─── Mutations ────────────────────────────────────────────────────────────────

export function useCreateJournalEntry() {
  const queryClient = useQueryClient()
  const mode        = useNexusStore(state => state.mode)

  return useMutation({
    mutationFn: async (content: string) => {
      const res = await fetch('/api/journal', {
        method:      'POST',
        headers:     { 'Content-Type': 'application/json' },
        credentials: 'include',
        body:        JSON.stringify({ content, mode }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Save failed' }))
        throw new Error(err.error)
      }
      const data = await res.json() as { entry: JournalEntry }
      return data.entry
    },

    // Optimistic update — entry appears immediately in list
    onMutate: async (content: string) => {
      await queryClient.cancelQueries({ queryKey: ['journal', 'list'] })

      const prev = queryClient.getQueryData<JournalListResponse>(
        ['journal', 'list', 20]
      )

      const optimistic: JournalEntry = {
        id:         `optimistic-${Date.now()}`,
        content,
        mode,
        word_count: content.split(/\s+/).filter(Boolean).length,
        ai_insight: null,
        created_at: new Date().toISOString(),
      }

      queryClient.setQueryData<JournalListResponse>(
        ['journal', 'list', 20],
        old => old
          ? { ...old, entries: [optimistic, ...old.entries] }
          : { entries: [optimistic], total: 1, offset: 0, limit: 20 }
      )

      return { prev }
    },

    onSuccess: (entry) => {
      // Replace optimistic entry with real entry
      queryClient.invalidateQueries({ queryKey: ['journal', 'list'] })
      queryClient.invalidateQueries({ queryKey: ['stats'] })

      // Sound + island notification
      playSound('journal-save')
      const wordCount = entry.word_count
      dispatchIslandEvent('journal', `JOURNAL SAVED — ${wordCount} WORDS`)
    },

    onError: (_, __, context) => {
      // Rollback optimistic update
      if (context?.prev) {
        queryClient.setQueryData(['journal', 'list', 20], context.prev)
      }
    },
  })
}
