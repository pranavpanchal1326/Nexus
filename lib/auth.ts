import 'server-only'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import type { User } from '@supabase/supabase-js'

// ─── Types ────────────────────────────────────────────────────────────────────

export class AuthError extends Error {
  constructor(
    message: string,
    public readonly code: 'UNAUTHORIZED' | 'SESSION_EXPIRED' | 'INVALID_TOKEN'
  ) {
    super(message)
    this.name = 'AuthError'
  }
}

interface AuthResult {
  user:   User
  userId: string
}

// ─── Auth guard ────────────────────────────────────────────────────────────────

/**
 * Validate Supabase session server-side.
 * Returns authenticated user data or throws AuthError.
 *
 * Usage in API routes:
 * ```typescript
 * const { userId } = await requireAuth()
 * ```
 *
 * Never call this in a client component.
 * Never skip this in an API route that returns user data.
 */
export async function requireAuth(): Promise<AuthResult> {
  const supabase = await createServerSupabaseClient()

  // Use getUser() — not getSession()
  // getSession() trusts the client-side JWT without server verification.
  // getUser() validates the JWT against Supabase Auth server.
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error) {
    throw new AuthError('Session validation failed', 'SESSION_EXPIRED')
  }

  if (!user) {
    throw new AuthError('No authenticated user', 'UNAUTHORIZED')
  }

  return {
    user,
    userId: user.id,
  }
}

// ─── Route handler wrapper ────────────────────────────────────────────────────

/**
 * Wraps a route handler with auth guard and consistent error handling.
 * Handles AuthError → 401, unknown → 500.
 *
 * Usage:
 * ```typescript
 * export const POST = withAuth(async (req, { userId }) => {
 *   // handler body
 * })
 * ```
 */
export function withAuth(
  handler: (req: Request, auth: AuthResult) => Promise<Response>
) {
  return async (req: Request): Promise<Response> => {
    try {
      const auth = await requireAuth()
      return await handler(req, auth)
    } catch (err) {
      if (err instanceof AuthError) {
        return Response.json(
          { error: err.message, code: err.code },
          { status: 401 }
        )
      }

      if (process.env.NODE_ENV === 'development') {
        console.error('[NEXUS API Error]', err)
      }

      return Response.json(
        { error: 'Internal server error', code: 'INTERNAL_ERROR' },
        { status: 500 }
      )
    }
  }
}

// ─── Consistent API response helpers ─────────────────────────────────────────

/**
 * Return a typed JSON success response.
 */
export function ok<T>(data: T, status = 200): Response {
  return Response.json(data, { status })
}

/**
 * Return a typed JSON error response.
 */
export function err(message: string, code: string, status: number): Response {
  return Response.json({ error: message, code }, { status })
}

/**
 * Return a 400 Bad Request with validation error message.
 */
export function badRequest(message: string): Response {
  return err(message, 'VALIDATION_ERROR', 400)
}

/**
 * Return a 404 Not Found.
 */
export function notFound(resource = 'Resource'): Response {
  return err(`${resource} not found`, 'NOT_FOUND', 404)
}
