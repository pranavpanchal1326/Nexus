import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'

// ─── Mock fetch ───────────────────────────────────────────────────────────────

global.fetch = vi.fn()

function mockAmbientResponse(insight: string) {
  ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
    ok:   true,
    json: async () => ({ insight }),
  })
}

function mockAmbientFailure() {
  ;(global.fetch as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
    new Error('Network error')
  )
}

// ─── Mock Zustand store ───────────────────────────────────────────────────────

vi.mock('@/store/nexusStore', () => ({
  useNexusStore: vi.fn((selector: (state: {
    mode: string
    signalStart: () => void
    signalStop: () => void
  }) => unknown) => selector({
    mode:        'apex',
    signalStart: vi.fn(),
    signalStop:  vi.fn(),
  })),
}))

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('useAmbientAI', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('starts with null insight and not loading', async () => {
    const { useAmbientAI } = await import('./useAmbientAI')
    const { result } = renderHook(() => useAmbientAI({
      surface: 'dashboard',
    }))
    expect(result.current.insight).toBeNull()
    expect(result.current.isLoading).toBe(false)
  })

  it('trigger sets insight from API response', async () => {
    const { useAmbientAI } = await import('./useAmbientAI')
    mockAmbientResponse('Three sessions this week, all before 8am')

    const { result } = renderHook(() => useAmbientAI({
      surface: 'dashboard',
    }))

    await act(async () => {
      await result.current.trigger('streak: 7 days, xp: 1200')
    })

    expect(result.current.insight).toBe('Three sessions this week, all before 8am')
  })

  it('trigger is silent on network failure', async () => {
    const { useAmbientAI } = await import('./useAmbientAI')
    mockAmbientFailure()

    const { result } = renderHook(() => useAmbientAI({
      surface: 'dashboard',
    }))

    await act(async () => {
      await result.current.trigger('some context')
    })

    // Failure is silent — no error thrown, insight remains null
    expect(result.current.insight).toBeNull()
    expect(result.current.isLoading).toBe(false)
  })

  it('cooldown prevents rapid successive calls', async () => {
    const { useAmbientAI } = await import('./useAmbientAI')
    mockAmbientResponse('First insight')
    mockAmbientResponse('Second insight')

    const { result } = renderHook(() => useAmbientAI({
      surface:  'dashboard',
      cooldown: 5000,
    }))

    // First call succeeds
    await act(async () => {
      await result.current.trigger('context 1')
    })
    expect(result.current.insight).toBe('First insight')

    // Second call within cooldown — blocked
    await act(async () => {
      await result.current.trigger('context 2')
    })
    expect(result.current.insight).toBe('First insight')   // Unchanged

    // Only one fetch call should have been made
    expect(global.fetch).toHaveBeenCalledTimes(1)
  })

  it('cooldown resets after reset()', async () => {
    const { useAmbientAI } = await import('./useAmbientAI')
    mockAmbientResponse('First insight')
    mockAmbientResponse('Second insight after reset')

    const { result } = renderHook(() => useAmbientAI({
      surface:  'dashboard',
      cooldown: 5000,
    }))

    await act(async () => {
      await result.current.trigger('context 1')
    })

    // Reset clears cooldown
    act(() => { result.current.reset() })

    await act(async () => {
      await result.current.trigger('context 2')
    })
    
    // We need to await next tick because fake timers don't advance microtasks for fetch
    await vi.runAllTimersAsync()

    expect(result.current.insight).toBe('Second insight after reset')
    expect(global.fetch).toHaveBeenCalledTimes(2)
  })

  it('clear() removes current insight', async () => {
    const { useAmbientAI } = await import('./useAmbientAI')
    mockAmbientResponse('An insight')

    const { result } = renderHook(() => useAmbientAI({
      surface: 'journal',
    }))

    await act(async () => {
      await result.current.trigger('some context')
    })

    expect(result.current.insight).toBe('An insight')

    act(() => { result.current.clear() })
    expect(result.current.insight).toBeNull()
  })

  it('disabled prevents trigger from firing', async () => {
    const { useAmbientAI } = await import('./useAmbientAI')
    mockAmbientResponse('Should not appear')

    const { result } = renderHook(() => useAmbientAI({
      surface: 'dashboard',
      enabled: false,
    }))

    await act(async () => {
      await result.current.trigger('context')
    })

    expect(result.current.insight).toBeNull()
    expect(global.fetch).not.toHaveBeenCalled()
  })

  it('does not trigger on empty context', async () => {
    const { useAmbientAI } = await import('./useAmbientAI')

    const { result } = renderHook(() => useAmbientAI({
      surface: 'dashboard',
    }))

    await act(async () => {
      await result.current.trigger('   ')  // Whitespace only
    })

    expect(global.fetch).not.toHaveBeenCalled()
  })

  it('deduplicates — same insight not shown twice in session', async () => {
    const { useAmbientAI } = await import('./useAmbientAI')

    // Both calls return the same insight
    mockAmbientResponse('The pattern is avoidance')
    mockAmbientResponse('The pattern is avoidance')

    // Use a unique surface to avoid cross-test session contamination
    const { result } = renderHook(() => useAmbientAI({
      surface:  'gym',
      cooldown: 0,   // No cooldown for this test
    }))

    await act(async () => {
      await result.current.trigger('context 1')
    })
    expect(result.current.insight).toBe('The pattern is avoidance')

    act(() => { result.current.clear() })

    // Second call — same insight returned — should not re-show
    await act(async () => {
      await result.current.trigger('context 2')
    })

    // Insight is cleared and not re-set because it was already seen
    expect(result.current.insight).toBeNull()
  })
})

// ─── AmbientIntel component tests ─────────────────────────────────────────────

describe('AmbientIntel component', () => {
  it('renders insight text when provided', async () => {
    // Component tests handled in Playwright E2E — Phase 7B
    // Unit: just verify the export exists
    const { AmbientIntel } = await import('../components/modules/AmbientIntel')
    expect(typeof AmbientIntel).toBe('function')
  })
})

// ─── Session deduplication tests ─────────────────────────────────────────────

describe('session insight deduplication', () => {
  it('tracks seen insights per surface independently', async () => {
    const { useAmbientAI } = await import('./useAmbientAI')

    // Same insight on different surfaces — should both show
    mockAmbientResponse('Same text different surface')
    mockAmbientResponse('Same text different surface')

    const journal = renderHook(() => useAmbientAI({
      surface:  'journal',
      cooldown: 0,
    }))

    const lexicon = renderHook(() => useAmbientAI({
      surface:  'lexicon',
      cooldown: 0,
    }))

    await act(async () => {
      await journal.result.current.trigger('journal context')
    })

    await act(async () => {
      await lexicon.result.current.trigger('lexicon context')
    })

    // Both should show — different surfaces
    expect(journal.result.current.insight).toBe('Same text different surface')
    expect(lexicon.result.current.insight).toBe('Same text different surface')
  })
})
