import { z } from 'zod'

// ─── Shared primitives ────────────────────────────────────────────────────────

const ModeSchema    = z.enum(['apex', 'haven'])
const PersonaSchema = z.enum(['commander', 'poet'])
const UnitSchema    = z.enum(['kg', 'lbs'])

// ─── Chat message schema ──────────────────────────────────────────────────────

const ChatMessageSchema = z.object({
  role:    z.enum(['user', 'assistant', 'system']),
  content: z.string().min(1).max(8000),
})

// ─── /api/chat ────────────────────────────────────────────────────────────────

export const ChatRequestSchema = z.object({
  message: z.string()
    .min(1,    'Message cannot be empty')
    .max(4000, 'Message too long — maximum 4000 characters'),

  mode: ModeSchema,

  history: z.array(ChatMessageSchema)
    .max(40, 'History too long — maximum 40 messages')
    .default([]),
})

export type ChatRequest = z.infer<typeof ChatRequestSchema>

/** @deprecated Use ChatRequestSchema — aligned with Phase 4A naming */
export const ChatSchema = ChatRequestSchema
export type ChatInput   = ChatRequest

// ─── /api/chat/ambient ───────────────────────────────────────────────────────

export const AmbientRequestSchema = z.object({
  /** The surface triggering ambient intelligence */
  surface: z.enum(['journal', 'dashboard', 'gym', 'lexicon']),

  /** Context for the AI — recent activity snippet */
  context: z.string()
    .min(1,    'Context cannot be empty')
    .max(2000, 'Context too long'),

  mode: ModeSchema,
})

export type AmbientRequest = z.infer<typeof AmbientRequestSchema>

/** @deprecated Use AmbientRequestSchema */
export const AmbientSchema = AmbientRequestSchema
export type AmbientInput   = AmbientRequest

// ─── /api/journal ─────────────────────────────────────────────────────────────

export const JournalCreateSchema = z.object({
  content: z.string()
    .min(1,     'Journal entry cannot be empty')
    .max(50000, 'Entry too long — maximum 50,000 characters'),

  mode: ModeSchema,

  word_count: z.number().int().min(0).optional(),
})

export type JournalCreate      = z.infer<typeof JournalCreateSchema>
/** @deprecated Use JournalCreate */
export type JournalCreateInput = JournalCreate

export const JournalQuerySchema = z.object({
  limit:  z.coerce.number().int().min(1).max(50).default(20),
  offset: z.coerce.number().int().min(0).default(0),
  mode:   ModeSchema.optional(),
})

export type JournalQuery = z.infer<typeof JournalQuerySchema>

// ─── /api/gym ─────────────────────────────────────────────────────────────────

export const GymLogCreateSchema = z.object({
  exercise: z.string()
    .min(1,   'Exercise name required')
    .max(100, 'Exercise name too long'),

  sets:   z.number().int().min(1).max(100),
  reps:   z.number().int().min(1).max(1000),
  weight: z.number().min(0).max(10000).optional(),
  unit:   UnitSchema.default('kg'),
  notes:  z.string().max(500).optional(),
})

export type GymLogCreate      = z.infer<typeof GymLogCreateSchema>
/** @deprecated Use GymLogCreate */
export type GymLogCreateInput = GymLogCreate

export const GymQuerySchema = z.object({
  limit:    z.coerce.number().int().min(1).max(100).default(30),
  exercise: z.string().optional(),
})

export type GymQuery = z.infer<typeof GymQuerySchema>

// ─── /api/lexicon/evaluate ────────────────────────────────────────────────────

export const LexiconEvaluateSchema = z.object({
  word:     z.string().min(1).max(100),
  sentence: z.string()
    .min(3,   'Sentence too short')
    .max(500, 'Sentence too long — maximum 500 characters'),
  mode:     ModeSchema,
})

export type LexiconEvaluate = z.infer<typeof LexiconEvaluateSchema>

/** @deprecated Use LexiconEvaluateSchema */
export const WordEvaluateSchema = LexiconEvaluateSchema
export type WordEvaluateInput   = LexiconEvaluate

// ─── /api/lexicon/words ───────────────────────────────────────────────────────

export const LexiconWordCreateSchema = z.object({
  word:          z.string().min(1).max(100),
  definition:    z.string().min(1).max(1000),
  usage_example: z.string().max(500).optional(),
})

export type LexiconWordCreate = z.infer<typeof LexiconWordCreateSchema>

/** @deprecated Use LexiconWordCreateSchema */
export const WordCreateSchema = LexiconWordCreateSchema
export type WordCreateInput   = LexiconWordCreate

export const LexiconQuerySchema = z.object({
  limit:  z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).default(0),
})

export type LexiconQuery = z.infer<typeof LexiconQuerySchema>

// ─── /api/stats ───────────────────────────────────────────────────────────────

// GET only — no request body schema needed
// Response type defined here for useStats hook

export const StatsResponseSchema = z.object({
  current_streak:  z.number().int().min(0),
  longest_streak:  z.number().int().min(0),
  cognitive_xp:    z.number().int().min(0),
  journal_count:   z.number().int().min(0),
  gym_count:       z.number().int().min(0),
  duel_count:      z.number().int().min(0),
  oracle_count:    z.number().int().min(0),
  heatmap: z.array(z.object({
    date:  z.string(),  // ISO date "2026-01-15"
    count: z.number().int().min(0).max(4),
  })),
  recent_activity: z.array(z.object({
    type:       z.enum(['journal', 'gym', 'duel', 'oracle']),
    preview:    z.string(),
    created_at: z.string(),
  })),
})

export type StatsResponse = z.infer<typeof StatsResponseSchema>

// ─── /api/export ─────────────────────────────────────────────────────────────

// GET only — authenticated, returns ZIP binary

// ─── Shared API error response ────────────────────────────────────────────────

export const APIErrorSchema = z.object({
  error: z.string(),
  code:  z.string(),
})

export type APIError = z.infer<typeof APIErrorSchema>

/** @deprecated Use APIErrorSchema */
export const ApiErrorSchema = APIErrorSchema
export type ApiError        = APIError

// ─── Lexicon judge response ───────────────────────────────────────────────────

export const LexiconJudgeResponseSchema = z.object({
  verdict:    z.enum(['correct', 'incorrect', 'partial']),
  score:      z.number().int().min(0).max(100),
  reasoning:  z.string(),
  xp_awarded: z.union([z.literal(0), z.literal(50), z.literal(100), z.literal(150)]),
})

export type LexiconJudgeResponse = z.infer<typeof LexiconJudgeResponseSchema>

// ─── Zod error formatter ──────────────────────────────────────────────────────

/**
 * Format Zod validation errors into a user-readable string.
 * Used in all API route handlers for consistent error formatting.
 */
export function formatZodError(error: z.ZodError): string {
  return error.issues
    .map((e: z.ZodIssue) => `${e.path.join('.')}: ${e.message}`)
    .join(', ')
}

/**
 * Safe parse wrapper — returns typed result or formatted error string.
 */
export function parseRequest<T extends z.ZodSchema>(
  schema: T,
  data:   unknown
): { success: true; data: z.infer<T> } | { success: false; error: string } {
  const result = schema.safeParse(data)
  if (result.success) return { success: true, data: result.data }
  return { success: false, error: formatZodError(result.error) }
}

/**
 * Legacy helper — returns a 400 Response with { error, code }.
 * @deprecated Use badRequest() from lib/auth.ts in route handlers
 */
export function apiError(
  error:  string,
  code:   string,
  status: number = 400
): Response {
  return Response.json(
    { error, code } satisfies ApiError,
    { status }
  )
}

// ─── Re-export persona/unit schemas for route use ─────────────────────────────
export { ModeSchema, PersonaSchema, UnitSchema }
