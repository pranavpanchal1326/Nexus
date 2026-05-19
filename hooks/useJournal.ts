'use client'
import {
  useQuery,
  useInfiniteQuery,
  useMutation,
  useQueryClient,
  type InfiniteData,
} from '@tanstack/react-query'
import { useNexusStore } from '@/store/nexusStore'
import { dispatchIslandEvent } from '@/lib/islandEvents'
import { playSound } from '@/lib/audio'
import { useInvalidateStats } from './useInvalidation'

export interface JournalEntry {
  id:         string
  content:    string
  mode:       'apex' | 'haven'
  word_count: number
  ai_insight: string | null
  created_at: string
}

export interface JournalListPage {
  entries: JournalEntry[]
  total:   number
  offset:  number
  limit:   number
  hasMore: boolean
}

const JOURNAL_PAGE_SIZE = 20

export const journalKeys = {
  all:      ['journal'] as const,
  lists:    () => [...journalKeys.all, 'list'] as const,
  list:     (filters: { mode?: string }) =>
    [...journalKeys.lists(), filters] as const,
  infinite: (filters: { mode?: string }) =>
    [...journalKeys.all, 'infinite', filters] as const,
  entry:    (id: string) => [...journalKeys.all, 'entry', id] as const,
}

export function useJournalList(limit = JOURNAL_PAGE_SIZE) {
  return useQuery<JournalListPage>({
    queryKey:   journalKeys.list({}),
    queryFn:    async () => {
      const res = await fetch(
        `/api/journal?limit=${limit}&offset=0`,
        { credentials: 'include' }
      )
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Fetch failed' }))
        throw new Error(err.error ?? `HTTP ${res.status}`)
      }
      const data = await res.json()
      return {
        ...data,
        hasMore: data.entries.length === limit,
      }
    },
    staleTime:  2 * 60 * 1000,
    retry:      2,
    retryDelay: attempt => Math.min(1000 * 2 ** attempt, 10_000),
  })
}

export function useInfiniteJournal(mode?: 'apex' | 'haven') {
  return useInfiniteQuery<JournalListPage>({
    queryKey:    journalKeys.infinite(mode ? { mode } : {}),
    queryFn:     async ({ pageParam = 0 }) => {
      const params = new URLSearchParams({
        limit:  String(JOURNAL_PAGE_SIZE),
        offset: String(pageParam as number),
      })
      if (mode) params.set('mode', mode)

      const res = await fetch(`/api/journal?${params}`, { credentials: 'include' })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)

      const data = await res.json()
      return {
        ...data,
        hasMore: data.entries.length === JOURNAL_PAGE_SIZE,
      }
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) =>
      lastPage.hasMore
        ? allPages.length * JOURNAL_PAGE_SIZE
        : undefined,
    staleTime: 2 * 60 * 1000,
  })
}

export function useAllJournalEntries(mode?: 'apex' | 'haven') {
  const { data, ...rest } = useInfiniteJournal(mode)
  const entries = (data as InfiniteData<JournalListPage> | undefined)
    ?.pages
    .flatMap(page => page.entries) ?? []
  return { entries, ...rest }
}

export function useCreateJournalEntry() {
  const queryClient = useQueryClient()
  const mode = useNexusStore(state => state.mode)
  const invalidateStats = useInvalidateStats()

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

    onMutate: async (content: string) => {
      await queryClient.cancelQueries({ queryKey: journalKeys.lists() })

      const previousList = queryClient.getQueryData<JournalListPage>(
        journalKeys.list({})
      )

      const optimistic: JournalEntry = {
        id:         `optimistic-${crypto.randomUUID()}`,
        content,
        mode,
        word_count: content.trim().split(/\s+/).filter(Boolean).length,
        ai_insight: null,
        created_at: new Date().toISOString(),
      }

      queryClient.setQueryData<JournalListPage>(
        journalKeys.list({}),
        old => old
          ? {
              ...old,
              entries: [optimistic, ...old.entries],
              total:   old.total + 1,
            }
          : {
              entries: [optimistic],
              total:   1,
              offset:  0,
              limit:   JOURNAL_PAGE_SIZE,
              hasMore: false,
            }
      )

      return { previousList, optimisticId: optimistic.id }
    },

    onSuccess: (entry, __, context) => {
      queryClient.setQueryData<JournalListPage>(
        journalKeys.list({}),
        old => {
          if (!old) return old
          return {
            ...old,
            entries: old.entries.map(e =>
              e.id === context?.optimisticId ? entry : e
            ),
          }
        }
      )

      queryClient.invalidateQueries({ queryKey: journalKeys.infinite({}) })
      invalidateStats()

      playSound('journal-save')
      dispatchIslandEvent('journal', `JOURNAL SAVED — ${entry.word_count} WORDS`)
    },

    onError: (err: Error, __, context) => {
      if (context?.previousList) {
        queryClient.setQueryData(journalKeys.list({}), context.previousList)
      }
      if (process.env.NODE_ENV === 'development') {
        console.error('[NEXUS Journal] Save failed:', err.message)
      }
    },
  })
}

export function useJournalStats() {
  const { data } = useJournalList(100)
  const entries = data?.entries ?? []

  return {
    totalEntries: entries.length,
    totalWords:   entries.reduce((sum, e) => sum + e.word_count, 0),
    apexEntries:  entries.filter(e => e.mode === 'apex').length,
    havenEntries: entries.filter(e => e.mode === 'haven').length,
    avgWordCount: entries.length > 0
      ? Math.round(entries.reduce((s, e) => s + e.word_count, 0) / entries.length)
      : 0,
  }
}
