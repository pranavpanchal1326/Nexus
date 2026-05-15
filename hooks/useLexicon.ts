'use client'
import {
  useQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query'
import { useNexusStore }    from '@/store/nexusStore'
import { dispatchIslandEvent } from '@/lib/islandEvents'
import { playSound }        from '@/lib/audio'

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

interface WordListResponse {
  words:  LexiconWord[]
  total:  number
  offset: number
  limit:  number
}

// ─── Queries ──────────────────────────────────────────────────────────────────

export function useLexiconWords(limit = 50) {
  return useQuery<WordListResponse>({
    queryKey:  ['lexicon', 'words', limit],
    queryFn:   async () => {
      const res = await fetch(
        `/api/lexicon/words?limit=${limit}&offset=0`,
        { credentials: 'include' }
      )
      if (!res.ok) throw new Error('Failed to fetch words')
      return res.json()
    },
    staleTime: 5 * 60 * 1000,
    retry:     2,
  })
}

// ─── Add word mutation ────────────────────────────────────────────────────────

export function useAddWord() {
  const queryClient = useQueryClient()

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

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lexicon'] })
    },
  })
}

// ─── Evaluate mutation ────────────────────────────────────────────────────────

export function useEvaluateDuel() {
  const queryClient = useQueryClient()
  const mode        = useNexusStore(state => state.mode)

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
      queryClient.invalidateQueries({ queryKey: ['lexicon'] })
      queryClient.invalidateQueries({ queryKey: ['stats'] })

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
