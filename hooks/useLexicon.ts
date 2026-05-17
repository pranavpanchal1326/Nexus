'use client'
import {
  useQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query'
import { useNexusStore } from '@/store/nexusStore'
import { dispatchIslandEvent } from '@/lib/islandEvents'
import { playSound } from '@/lib/audio'
import { useInvalidateStats } from './useInvalidation'
import { useMemo } from 'react'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface LexiconWord {
  id:            string
  word:          string
  definition:    string
  usage_example: string | null
  cognitive_xp:  number
  usage_count:   number
  last_used_at:  string | null
  created_at:    string
}

export interface EvaluationResult {
  verdict:           'correct' | 'incorrect' | 'partial'
  score:             number
  reasoning:         string
  xp_awarded:        0 | 50 | 100 | 150
  word:              string
  sentence:          string
  mode:              'apex' | 'haven'
  word_id:           string
  total_word_xp:     number
  total_usage_count: number
}

export type WordSortMode =
  | 'recent'
  | 'oldest'
  | 'xp-high'
  | 'xp-low'
  | 'alpha'

interface WordListResponse {
  words:  LexiconWord[]
  total:  number
  offset: number
  limit:  number
}

export const lexiconKeys = {
  all:   ['lexicon'] as const,
  words: () => [...lexiconKeys.all, 'words'] as const,
  list:  (limit: number) => [...lexiconKeys.words(), limit] as const,
  word:  (id: string) => [...lexiconKeys.all, 'word', id] as const,
  duels: () => [...lexiconKeys.all, 'duels'] as const,
}

// ─── Queries ──────────────────────────────────────────────────────────────────

export function useLexiconWords(limit = 100) {
  return useQuery<WordListResponse>({
    queryKey:  lexiconKeys.list(limit),
    queryFn:   async () => {
      const res = await fetch(
        `/api/lexicon/words?limit=${limit}&offset=0`,
        { credentials: 'include' }
      )
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      return res.json()
    },
    staleTime: 5 * 60 * 1000,
    retry:     2,
  })
}

export function useSortedWords(sortMode: WordSortMode = 'recent', search = '') {
  const { data, isLoading, error } = useLexiconWords(200)
  const words = data?.words ?? []

  const processed = useMemo(() => {
    let filtered = search.trim()
      ? words.filter(w =>
          w.word.toLowerCase().includes(search.toLowerCase()) ||
          w.definition.toLowerCase().includes(search.toLowerCase())
        )
      : words

    const sorted = [...filtered]
    switch (sortMode) {
      case 'recent':
        sorted.sort((a, b) => {
          if (!a.last_used_at && !b.last_used_at) return 0
          if (!a.last_used_at) return -1
          if (!b.last_used_at) return 1
          return new Date(b.last_used_at).getTime() -
                 new Date(a.last_used_at).getTime()
        })
        break
      case 'oldest':
        sorted.sort((a, b) =>
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        )
        break
      case 'xp-high':
        sorted.sort((a, b) => b.cognitive_xp - a.cognitive_xp)
        break
      case 'xp-low':
        sorted.sort((a, b) => a.cognitive_xp - b.cognitive_xp)
        break
      case 'alpha':
        sorted.sort((a, b) => a.word.localeCompare(b.word))
        break
    }

    return sorted
  }, [words, sortMode, search])

  return { words: processed, isLoading, error, total: data?.total ?? 0 }
}

export function useWordsDueForPractice(limit = 12): LexiconWord[] {
  const { data } = useLexiconWords(200)
  const words = data?.words ?? []

  return [...words]
    .sort((a, b) => {
      if (a.usage_count === 0 && b.usage_count !== 0) return -1
      if (b.usage_count === 0 && a.usage_count !== 0) return 1
      if (a.cognitive_xp !== b.cognitive_xp) return a.cognitive_xp - b.cognitive_xp
      if (!a.last_used_at) return -1
      if (!b.last_used_at) return 1
      return new Date(a.last_used_at).getTime() - new Date(b.last_used_at).getTime()
    })
    .slice(0, limit)
}

export function useLexiconStats() {
  const { data } = useLexiconWords(500)
  const words = data?.words ?? []

  return {
    totalWords:     words.length,
    totalXP:        words.reduce((s, w) => s + w.cognitive_xp, 0),
    totalDuels:     words.reduce((s, w) => s + w.usage_count, 0),
    masteredWords:  words.filter(w => w.cognitive_xp >= 150).length,
    untouchedWords: words.filter(w => w.usage_count === 0).length,
    topWord:        words.reduce(
      (top, w) => (w.cognitive_xp > (top?.cognitive_xp ?? -1) ? w : top),
      null as LexiconWord | null
    ),
  }
}

// ─── Add word mutation ────────────────────────────────────────────────────────

export function useAddWord() {
  const queryClient = useQueryClient()
  const invalidateStats = useInvalidateStats()

  return useMutation({
    mutationFn: async (payload: {
      word:           string
      definition:     string
      usage_example?: string
    }) => {
      const res = await fetch('/api/lexicon/words', {
        method:      'POST',
        headers:     { 'Content-Type': 'application/json' },
        credentials: 'include',
        body:        JSON.stringify(payload),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Add failed' }))
        throw new Error(err.error)
      }

      return res.json() as Promise<{ word: LexiconWord }>
    },

    onMutate: async (payload) => {
      await queryClient.cancelQueries({ queryKey: lexiconKeys.words() })

      const previous = queryClient.getQueryData<WordListResponse>(
        lexiconKeys.list(100)
      )

      const optimistic: LexiconWord = {
        id:            `optimistic-${crypto.randomUUID()}`,
        word:          payload.word.toLowerCase().trim(),
        definition:    payload.definition.trim(),
        usage_example: payload.usage_example?.trim() ?? null,
        cognitive_xp:  0,
        usage_count:   0,
        last_used_at:  null,
        created_at:    new Date().toISOString(),
      }

      queryClient.setQueryData<WordListResponse>(
        lexiconKeys.list(100),
        old => old
          ? { ...old, words: [optimistic, ...old.words], total: old.total + 1 }
          : { words: [optimistic], total: 1, offset: 0, limit: 100 }
      )

      return { previous }
    },

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: lexiconKeys.words() })
      invalidateStats()
    },

    onError: (_, __, context) => {
      if (context?.previous) {
        queryClient.setQueryData(lexiconKeys.list(100), context.previous)
      }
    },
  })
}

// ─── Evaluate mutation ────────────────────────────────────────────────────────

export function useEvaluateDuel() {
  const queryClient = useQueryClient()
  const mode        = useNexusStore(state => state.mode)
  const invalidateStats = useInvalidateStats()

  return useMutation<EvaluationResult, Error, { word: string; sentence: string }>({
    mutationFn: async ({ word, sentence }) => {
      const res = await fetch('/api/lexicon/evaluate', {
        method:      'POST',
        headers:     { 'Content-Type': 'application/json' },
        credentials: 'include',
        body:        JSON.stringify({ word, sentence, mode }),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Evaluation failed' }))
        throw new Error(err.error)
      }

      return res.json()
    },

    onSuccess: (result) => {
      queryClient.setQueryData<WordListResponse>(
        lexiconKeys.list(100),
        old => {
          if (!old) return old
          return {
            ...old,
            words: old.words.map(w =>
              w.id === result.word_id
                ? {
                    ...w,
                    cognitive_xp: result.total_word_xp,
                    usage_count:  result.total_usage_count,
                    last_used_at: new Date().toISOString(),
                  }
                : w
            ),
          }
        }
      )

      invalidateStats()

      // Sound based on verdict
      if (result.verdict === 'correct') {
        playSound('duel-win')
        dispatchIslandEvent('duel', `DUEL WON — +${result.xp_awarded} XP`)
      } else if (result.verdict === 'incorrect') {
        playSound('duel-lose')
        dispatchIslandEvent('duel', `DUEL LOST — ${result.word.toUpperCase()}`)
      } else {
        dispatchIslandEvent('duel', `PARTIAL — +${result.xp_awarded} XP`)
      }
    },
  })
}
