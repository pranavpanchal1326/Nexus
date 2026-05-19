import '@testing-library/jest-dom'
import { vi, beforeAll, afterAll, afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'

// ─── Cleanup after each test ───────────────────────────────────────────────────
afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

// ─── Mock Next.js router ───────────────────────────────────────────────────────
vi.mock('next/navigation', () => ({
  useRouter:   vi.fn(() => ({
    push:     vi.fn(),
    replace:  vi.fn(),
    refresh:  vi.fn(),
    back:     vi.fn(),
    prefetch: vi.fn(),
  })),
  usePathname:        vi.fn(() => '/dashboard'),
  useSearchParams:    vi.fn(() => new URLSearchParams()),
  useParams:          vi.fn(() => ({})),
  redirect:           vi.fn(),
  notFound:           vi.fn(),
}))

// ─── Mock Next.js font ────────────────────────────────────────────────────────
vi.mock('next/font/google', () => ({
  Instrument_Serif: vi.fn(() => ({ variable: '--font-serif', className: 'serif' })),
  Geist_Mono:       vi.fn(() => ({ variable: '--font-mono', className: 'mono' })),
}))

vi.mock('next/font/local', () => ({
  default: vi.fn(() => ({ variable: '--font-sans', className: 'sans' })),
}))

// ─── Mock server-only ─────────────────────────────────────────────────────────
vi.mock('server-only', () => ({}))

// ─── Mock Web Audio API ───────────────────────────────────────────────────────
const mockGainNode = {
  gain: {
    value:                       1,
    setValueAtTime:              vi.fn(),
    linearRampToValueAtTime:     vi.fn(),
    exponentialRampToValueAtTime: vi.fn(),
    setTargetAtTime:             vi.fn(),
  },
  connect:    vi.fn(),
  disconnect: vi.fn(),
}

const mockOscillator = {
  type:      'sine',
  frequency: {
    value:                       440,
    setValueAtTime:              vi.fn(),
    exponentialRampToValueAtTime: vi.fn(),
  },
  connect:    vi.fn(),
  start:      vi.fn(),
  stop:       vi.fn(),
}

const mockAudioContext = {
  currentTime:    0,
  state:          'running',
  sampleRate:     44100,
  destination:    {},
  createOscillator: vi.fn(() => ({ ...mockOscillator })),
  createGain:       vi.fn(() => ({ ...mockGainNode })),
  createBiquadFilter: vi.fn(() => ({
    type:      'lowpass',
    frequency: { value: 440 },
    Q:         { value: 1 },
    connect:   vi.fn(),
  })),
  createBuffer: vi.fn((_ch: number, size: number) => ({
    getChannelData: vi.fn(() => new Float32Array(size)),
  })),
  createBufferSource: vi.fn(() => ({
    buffer:  null,
    connect: vi.fn(),
    start:   vi.fn(),
  })),
  resume: vi.fn(() => Promise.resolve()),
}

global.AudioContext = vi.fn(() => mockAudioContext) as unknown as typeof AudioContext

// ─── Mock IntersectionObserver ────────────────────────────────────────────────
global.IntersectionObserver = vi.fn().mockImplementation((callback) => ({
  observe:    vi.fn(() => callback([{ isIntersecting: true }])),
  unobserve:  vi.fn(),
  disconnect: vi.fn(),
}))

// ─── Mock ResizeObserver ──────────────────────────────────────────────────────
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe:    vi.fn(),
  unobserve:  vi.fn(),
  disconnect: vi.fn(),
}))

// ─── Mock localStorage ────────────────────────────────────────────────────────
const localStorageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem:    (k: string) => store[k] ?? null,
    setItem:    (k: string, v: string) => { store[k] = v },
    removeItem: (k: string) => { delete store[k] },
    clear:      () => { store = {} },
    get length() { return Object.keys(store).length },
    key:        (i: number) => Object.keys(store)[i] ?? null,
  }
})()

Object.defineProperty(window, 'localStorage', { value: localStorageMock })

// ─── Mock crypto.randomUUID ───────────────────────────────────────────────────
Object.defineProperty(global, 'crypto', {
  value: {
    randomUUID: vi.fn(() => '00000000-0000-4000-8000-000000000001'),
    getRandomValues: vi.fn((arr: Uint8Array) => arr),
  },
})

// ─── Mock fetch ───────────────────────────────────────────────────────────────
global.fetch = vi.fn()

// ─── Mock window.speechSynthesis ─────────────────────────────────────────────
Object.defineProperty(window, 'speechSynthesis', {
  value: {
    speak:          vi.fn(),
    cancel:         vi.fn(),
    getVoices:      vi.fn(() => []),
    speaking:       false,
    pending:        false,
    paused:         false,
  },
})

// ─── Mock window.dispatchEvent ────────────────────────────────────────────────
const originalDispatchEvent = window.dispatchEvent.bind(window)
window.dispatchEvent = vi.fn(originalDispatchEvent)

// ─── Mock navigator.vibrate ───────────────────────────────────────────────────
Object.defineProperty(navigator, 'vibrate', {
  value: vi.fn(),
})

// ─── Console suppression for known noise ──────────────────────────────────────
const originalConsoleError = console.error
beforeAll(() => {
  console.error = (...args: unknown[]) => {
    const msg = String(args[0] ?? '')
    // Suppress known React testing noise
    if (msg.includes('Warning: ReactDOM.render')) return
    if (msg.includes('Warning: An update to')) return
    if (msg.includes('act(...)')) return
    originalConsoleError(...args)
  }
})
afterAll(() => {
  console.error = originalConsoleError
})
