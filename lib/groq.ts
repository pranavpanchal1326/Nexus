/**
 * NEXUS v2.0 — Groq SDK Server Instance
 *
 * CRITICAL: This file is SERVER-ONLY.
 * Never import this from:
 *   - Any component file
 *   - Any hooks file
 *   - Any store file
 *   - Any lib file except those in app/api/
 *
 * The API key is loaded from environment server-side.
 * It never reaches the browser bundle.
 * There is no dangerouslyAllowBrowser flag.
 * That flag does not exist in NEXUS v2.0.
 */

import Groq from 'groq-sdk'

// Validate API key exists at startup
// Fails loudly in development if misconfigured
if (!process.env.GROQ_API_KEY) {
  throw new Error(
    '[NEXUS] GROQ_API_KEY is not set in environment variables. ' +
    'Add it to .env.local — never with NEXT_PUBLIC_ prefix.'
  )
}

/**
 * Singleton Groq client — server-side only
 * Import ONLY in app/api/ route handlers
 */
export const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
})

/**
 * The one model. Always.
 * PRD Section 4 — Tech Stack
 */
export const NEXUS_MODEL = 'llama-3.3-70b-versatile' as const

/**
 * Token limits per context
 * Commander is terse. Poet is expansive. Ambient is surgical.
 */
export const TOKEN_LIMITS = {
  COMMANDER: 200,
  POET:      400,
  AMBIENT:   60,
  EVALUATE:  150,
} as const

export type TokenLimitKey = keyof typeof TOKEN_LIMITS
