/**
 * NEXUS v2.0 — Groq SDK Server Instance
 *
 * SECURITY: This file is server-only.
 * The 'server-only' import below causes a build error
 * if this module is ever imported in a client component.
 * This is intentional. Never remove it.
 *
 * GROQ_API_KEY must never have a NEXT_PUBLIC_ prefix.
 * It must never appear in any client bundle.
 */
import 'server-only'
import Groq from 'groq-sdk'

// ─── Validation ───────────────────────────────────────────────────────────────

if (!process.env.GROQ_API_KEY) {
  throw new Error(
    '[NEXUS] GROQ_API_KEY is not set.\n' +
    'Add GROQ_API_KEY to your .env.local file.\n' +
    'Never prefix it with NEXT_PUBLIC_.'
  )
}

// ─── SDK Singleton ────────────────────────────────────────────────────────────

/**
 * Single Groq SDK instance shared across all API routes.
 * Instantiated once at module load — not per-request.
 * Connection pooling handled by the SDK internally.
 */
export const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
  // dangerouslyAllowBrowser is explicitly NOT set.
  // It defaults to false — this is correct and intentional.
  // If you see dangerouslyAllowBrowser anywhere in this codebase
  // that is a critical security violation.
  maxRetries: 2,
  timeout:    30_000,  // 30s timeout — streaming responses can be slow
})

// ─── Model Constants ──────────────────────────────────────────────────────────

/**
 * Primary model — llama-3.3-70b-versatile
 * Used for: Oracle chat, Lexicon duel evaluation, ambient insights
 * Better reasoning than 8b — required for Commander/Poet persona fidelity
 */
export const GROQ_MODEL = 'llama-3.3-70b-versatile' as const

/**
 * Fast model — llama-3.1-8b-instant
 * Used for: Ambient single-sentence insights where speed > depth
 * Faster TTFB — ambient surfaces must feel immediate
 */
export const GROQ_MODEL_FAST = 'llama-3.1-8b-instant' as const

// ─── Legacy alias — kept for any existing code referencing NEXUS_MODEL ────────
/** @deprecated Use GROQ_MODEL instead */
export const NEXUS_MODEL = GROQ_MODEL

// ─── Token budgets per surface ────────────────────────────────────────────────

export const MAX_TOKENS = {
  ORACLE_APEX:     200,  // Commander: terse, dense — 120 word limit
  ORACLE_HAVEN:    400,  // Poet: expansive, flowing — 200 word limit
  AMBIENT:          60,  // Ambient surface: exactly one sentence, 12 words max
  LEXICON_EVAL:    150,  // Duel evaluation: verdict + brief reasoning
  GYM_DELTA:        80,  // Volume delta whisper: one line
  JOURNAL_INSIGHT:  80,  // Journal ambient: one sentence
} as const

export type MaxTokenKey = keyof typeof MAX_TOKENS

// ─── Legacy alias — kept for any existing code referencing TOKEN_LIMITS ───────
/** @deprecated Use MAX_TOKENS instead */
export const TOKEN_LIMITS = {
  COMMANDER: MAX_TOKENS.ORACLE_APEX,
  POET:      MAX_TOKENS.ORACLE_HAVEN,
  AMBIENT:   MAX_TOKENS.AMBIENT,
  EVALUATE:  MAX_TOKENS.LEXICON_EVAL,
} as const

export type TokenLimitKey = keyof typeof TOKEN_LIMITS

// ─── Temperature per persona ──────────────────────────────────────────────────

export const TEMPERATURE = {
  COMMANDER: 0.3,   // Low — Commander is precise, consistent, not random
  POET:      0.85,  // Higher — Poet has expressive variation, never robotic
  AMBIENT:   0.6,   // Balanced — ambient insights need variety but not chaos
} as const
