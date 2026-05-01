import { z } from 'zod'

// ─── Chat ─────────────────────────────────────────────
export const ChatMessageSchema = z.object({
  role:    z.enum(['user', 'assistant']),
  content: z.string().min(1).max(8000),
})

export const ChatSchema = z.object({
  message: z.string().min(1).max(4000),
  mode:    z.enum(['apex', 'haven']),
  history: z.array(ChatMessageSchema).max(50).default([]),
})

export const AmbientSchema = z.object({
  context: z.string().min(1).max(2000),
  surface: z.enum(['journal', 'dashboard', 'gym', 'lexicon']),
})

// ─── Journal ──────────────────────────────────────────
export const JournalCreateSchema = z.object({
  content:    z.string().min(1).max(50000),
  mode:       z.enum(['apex', 'haven']),
  word_count: z.number().int().min(0).optional(),
})

export const JournalQuerySchema = z.object({
  limit:  z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
  mode:   z.enum(['apex', 'haven']).optional(),
})

// ─── Gym ──────────────────────────────────────────────
export const GymLogCreateSchema = z.object({
  exercise: z.string().min(1).max(100),
  sets:     z.number().int().min(1).max(100),
  reps:     z.number().int().min(1).max(1000),
  weight:   z.number().min(0).max(9999).optional(),
  unit:     z.enum(['kg', 'lbs']).default('kg'),
  notes:    z.string().max(500).optional(),
})

export const GymQuerySchema = z.object({
  limit:    z.coerce.number().int().min(1).max(100).default(20),
  exercise: z.string().optional(),
})

// ─── Lexicon ──────────────────────────────────────────
export const WordCreateSchema = z.object({
  word:          z.string().min(1).max(100),
  definition:    z.string().min(1).max(1000),
  usage_example: z.string().max(500).optional(),
})

export const WordEvaluateSchema = z.object({
  word:     z.string().min(1).max(100),
  sentence: z.string().min(1).max(1000),
  mode:     z.enum(['apex', 'haven']),
})

export const LexiconQuerySchema = z.object({
  limit:  z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
})

// ─── Inferred Types ───────────────────────────────────
export type ChatInput         = z.infer<typeof ChatSchema>
export type AmbientInput      = z.infer<typeof AmbientSchema>
export type JournalCreateInput = z.infer<typeof JournalCreateSchema>
export type JournalQuery      = z.infer<typeof JournalQuerySchema>
export type GymLogCreateInput = z.infer<typeof GymLogCreateSchema>
export type GymQuery          = z.infer<typeof GymQuerySchema>
export type WordCreateInput   = z.infer<typeof WordCreateSchema>
export type WordEvaluateInput = z.infer<typeof WordEvaluateSchema>
export type LexiconQuery      = z.infer<typeof LexiconQuerySchema>

// ─── API Error Response ───────────────────────────────
export const ApiErrorSchema = z.object({
  error: z.string(),
  code:  z.string(),
})

export type ApiError = z.infer<typeof ApiErrorSchema>

// ─── API Success Helper ───────────────────────────────
export function apiError(
  error: string,
  code: string,
  status: number = 400
): Response {
  return Response.json(
    { error, code } satisfies ApiError,
    { status }
  )
}
