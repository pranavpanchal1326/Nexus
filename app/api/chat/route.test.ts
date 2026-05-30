/**
 * NEXUS v2.0 — Phase 4B Integration Tests
 * Tests for /api/chat, /api/chat/ambient, and lib/stream utilities.
 *
 * Run: npx vitest run app/api/chat/route.test.ts
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

// ─── Mock next/headers (used by createServerSupabaseClient) ───────────────────

vi.mock('next/headers', () => ({
  cookies: vi.fn(async () => ({
    getAll: () => [],
    set:    () => {},
  })),
}))

// ─── Mock server-only (aliased in vitest.config.ts but explicit here too) ─────

vi.mock('server-only', () => ({}))

// ─── Mock Groq SDK ────────────────────────────────────────────────────────────

const mockStreamChunks = ['Hello', ' Commander', '.', ' Status', ' nominal', '.']

const mockStream = {
  async *[Symbol.asyncIterator]() {
    for (const chunk of mockStreamChunks) {
      yield { choices: [{ delta: { content: chunk } }] }
    }
  },
}

const mockGroqCreate = vi.fn(async ({ stream }: { stream: boolean }) => {
  if (stream) return mockStream
  return {
    choices: [{ message: { content: 'Three sessions this week, all before 8am' } }],
  }
})

vi.mock('@/lib/groq', () => ({
  groq: {
    chat: {
      completions: { create: mockGroqCreate },
    },
  },
  GROQ_MODEL:      'llama-3.3-70b-versatile',
  GROQ_MODEL_FAST: 'llama-3.1-8b-instant',
  MAX_TOKENS: {
    ORACLE_APEX:     200,
    ORACLE_HAVEN:    400,
    AMBIENT:          60,
    LEXICON_EVAL:    150,
    GYM_DELTA:        80,
    JOURNAL_INSIGHT:  80,
  },
  TEMPERATURE: {
    COMMANDER: 0.3,
    POET:      0.85,
    AMBIENT:   0.6,
  },
}))

// ─── Mock Supabase ────────────────────────────────────────────────────────────

const mockInsert = vi.fn(() => Promise.resolve({ error: null }))
const mockGetUser = vi.fn(() =>
  Promise.resolve({
    data:  { user: { id: 'test-user-id', email: 'test@nexus.app' } as unknown as { id: string; email: string } | null },
    error: null as unknown as Error | null,
  })
)
const mockRpc = vi.fn(() => Promise.resolve({ error: null }))

const mockSupabase = {
  from: vi.fn(() => ({ insert: mockInsert })),
  auth:  { getUser: mockGetUser },
  rpc:   mockRpc,
}

vi.mock('@/lib/supabase/server', () => ({
  createServerSupabaseClient: vi.fn(async () => mockSupabase),
  createServiceRoleClient: vi.fn(() => mockSupabase),
}))

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeRequest(
  url:  string,
  body: unknown,
  method = 'POST'
): Request {
  return new Request(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(body),
  })
}

// ─── POST /api/chat ───────────────────────────────────────────────────────────

describe('POST /api/chat', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetUser.mockResolvedValue({
      data:  { user: { id: 'test-user-id', email: 'test@nexus.app' } },
      error: null,
    })
    mockInsert.mockResolvedValue({ error: null })
    mockSupabase.from.mockReturnValue({ insert: mockInsert })
  })

  it('returns 401 with no auth session', async () => {
    mockGetUser.mockResolvedValueOnce({
      data:  { user: null },
      error: new Error('No session'),
    })

    const { POST } = await import('./route')
    const res = await POST(makeRequest('http://localhost/api/chat', {
      message: 'Hello', mode: 'apex', history: [],
    }))

    expect(res.status).toBe(401)
    const body = await res.json()
    expect(body.code).toBe('SESSION_EXPIRED')
  })

  it('returns 400 for empty message', async () => {
    const { POST } = await import('./route')
    const res = await POST(makeRequest('http://localhost/api/chat', {
      message: '', mode: 'apex', history: [],
    }))
    expect(res.status).toBe(400)
  })

  it('returns 400 for invalid mode', async () => {
    const { POST } = await import('./route')
    const res = await POST(makeRequest('http://localhost/api/chat', {
      message: 'Hello', mode: 'invalid', history: [],
    }))
    expect(res.status).toBe(400)
  })

  it('returns 400 for malformed JSON body', async () => {
    const { POST } = await import('./route')
    const res = await POST(new Request('http://localhost/api/chat', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    'not-json',
    }))
    expect(res.status).toBe(400)
  })

  it('returns 400 for history over 40 messages', async () => {
    const { POST } = await import('./route')
    const res = await POST(makeRequest('http://localhost/api/chat', {
      message: 'Hello',
      mode:    'apex',
      history: Array.from({ length: 41 }, (_, i) => ({
        role: 'user', content: `Message ${i}`,
      })),
    }))
    expect(res.status).toBe(400)
  })

  it('returns 200 with text/plain Content-Type for valid apex request', async () => {
    const { POST } = await import('./route')
    const res = await POST(makeRequest('http://localhost/api/chat', {
      message: 'Status report.', mode: 'apex', history: [],
    }))
    expect(res.status).toBe(200)
    expect(res.headers.get('Content-Type')).toContain('text/plain')
  })

  it('sets X-NEXUS-Persona: commander for apex mode', async () => {
    const { POST } = await import('./route')
    const res = await POST(makeRequest('http://localhost/api/chat', {
      message: 'Status.', mode: 'apex', history: [],
    }))
    expect(res.status).toBe(200)
    expect(res.headers.get('X-NEXUS-Persona')).toBe('commander')
    expect(res.headers.get('X-NEXUS-Mode')).toBe('apex')
  })

  it('sets X-NEXUS-Persona: poet for haven mode', async () => {
    const { POST } = await import('./route')
    const res = await POST(makeRequest('http://localhost/api/chat', {
      message: 'How am I doing?', mode: 'haven', history: [],
    }))
    expect(res.status).toBe(200)
    expect(res.headers.get('X-NEXUS-Persona')).toBe('poet')
    expect(res.headers.get('X-NEXUS-Mode')).toBe('haven')
  })

  it('sets Cache-Control: no-store', async () => {
    const { POST } = await import('./route')
    const res = await POST(makeRequest('http://localhost/api/chat', {
      message: 'Status.', mode: 'apex', history: [],
    }))
    expect(res.headers.get('Cache-Control')).toContain('no-store')
  })

  it('streams response body — all mock chunks concatenated', async () => {
    const { POST } = await import('./route')
    const res  = await POST(makeRequest('http://localhost/api/chat', {
      message: 'Status.', mode: 'apex', history: [],
    }))
    const text = await res.text()
    expect(text).toBe(mockStreamChunks.join(''))
  })

  it('inserts user message into chat_history before streaming', async () => {
    const { POST } = await import('./route')
    await POST(makeRequest('http://localhost/api/chat', {
      message: 'Analyze my week.', mode: 'apex', history: [],
    }))
    expect(mockSupabase.from).toHaveBeenCalledWith('chat_history')
    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: 'test-user-id',
        role:    'user',
        content: 'Analyze my week.',
        mode:    'apex',
        persona: 'commander',
      })
    )
  })
})

// ─── POST /api/chat/ambient ───────────────────────────────────────────────────

describe('POST /api/chat/ambient', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetUser.mockResolvedValue({
      data:  { user: { id: 'test-user-id', email: 'test@nexus.app' } },
      error: null,
    })
    mockGroqCreate.mockResolvedValue({
      choices: [{ message: { content: 'Three sessions this week, all before 8am' } }],
    })
  })

  it('returns 200 with insight string for valid request', async () => {
    const { POST } = await import('./ambient/route')
    const res  = await POST(makeRequest('http://localhost/api/chat/ambient', {
      surface: 'journal',
      context: 'User wrote 500 words about feeling stuck on a project.',
      mode:    'haven',
    }))
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(typeof body.insight).toBe('string')
  })

  it('returns 200 with empty insight on Groq failure — silent failure', async () => {
    mockGroqCreate.mockRejectedValueOnce(new Error('Rate limited'))

    const { POST } = await import('./ambient/route')
    const res  = await POST(makeRequest('http://localhost/api/chat/ambient', {
      surface: 'dashboard',
      context: 'User has 7 day streak.',
      mode:    'apex',
    }))
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.insight).toBe('')
  })

  it('strips trailing punctuation from ambient insight', async () => {
    mockGroqCreate.mockResolvedValueOnce({
      choices: [{ message: { content: 'The pattern is avoidance.' } }],
    })

    const { POST } = await import('./ambient/route')
    const res  = await POST(makeRequest('http://localhost/api/chat/ambient', {
      surface: 'journal',
      context: 'User avoided writing for 3 days.',
      mode:    'apex',
    }))
    const body = await res.json()

    // Trailing period must be stripped
    expect(body.insight.endsWith('.')).toBe(false)
    expect(body.insight).toBe('The pattern is avoidance')
  })

  it('returns 400 for invalid surface', async () => {
    const { POST } = await import('./ambient/route')
    const res = await POST(makeRequest('http://localhost/api/chat/ambient', {
      surface: 'invalid_surface',
      context: 'some context',
      mode:    'apex',
    }))
    expect(res.status).toBe(400)
  })
})

// ─── lib/stream utilities ─────────────────────────────────────────────────────

describe('tokenizeStreamedText', () => {
  it('splits text into tokens that round-trip correctly', async () => {
    const { tokenizeStreamedText } = await import('@/lib/stream')
    const original = 'Hello world foo'
    const tokens   = tokenizeStreamedText(original)
    expect(tokens.join('')).toBe(original)
  })

  it('preserves punctuation attached to words', async () => {
    const { tokenizeStreamedText } = await import('@/lib/stream')
    const original = 'Status nominal.'
    const tokens   = tokenizeStreamedText(original)
    expect(tokens.join('')).toBe(original)
  })

  it('returns empty array for empty string', async () => {
    const { tokenizeStreamedText } = await import('@/lib/stream')
    expect(tokenizeStreamedText('')).toEqual([])
  })

  it('returns at least one token for a single word', async () => {
    const { tokenizeStreamedText } = await import('@/lib/stream')
    const tokens = tokenizeStreamedText('Commander')
    expect(tokens.length).toBeGreaterThan(0)
    expect(tokens.join('')).toBe('Commander')
  })
})

describe('createStreamStatus / updateStreamStatus', () => {
  it('creates idle status', async () => {
    const { createStreamStatus } = await import('@/lib/stream')
    const status = createStreamStatus()
    expect(status.state).toBe('idle')
    expect(status.accumulated).toBe('')
    expect(status.wordCount).toBe(0)
    expect(status.charCount).toBe(0)
  })

  it('updates to streaming state on first chunk', async () => {
    const { createStreamStatus, updateStreamStatus } = await import('@/lib/stream')
    const status  = createStreamStatus()
    const updated = updateStreamStatus(status, 'Hello world')
    expect(updated.state).toBe('streaming')
    expect(updated.accumulated).toBe('Hello world')
    expect(updated.wordCount).toBe(2)
    expect(updated.charCount).toBe(11)
  })

  it('accumulates multiple chunks correctly', async () => {
    const { createStreamStatus, updateStreamStatus } = await import('@/lib/stream')
    let status = createStreamStatus()
    status = updateStreamStatus(status, 'Hello')
    status = updateStreamStatus(status, ' world')
    expect(status.accumulated).toBe('Hello world')
    expect(status.charCount).toBe(11)
    expect(status.wordCount).toBe(2)
  })
})
