import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock Web Audio API for test environment
const mockGain = {
  gain: {
    value:                    1,
    setValueAtTime:           vi.fn(),
    linearRampToValueAtTime:  vi.fn(),
    exponentialRampToValueAtTime: vi.fn(),
    setTargetAtTime:          vi.fn(),
  },
  connect: vi.fn(),
}

const mockOscillator = {
  type:      'sine',
  frequency: {
    value:                        440,
    setValueAtTime:               vi.fn(),
    exponentialRampToValueAtTime: vi.fn(),
  },
  connect: vi.fn(),
  start:   vi.fn(),
  stop:    vi.fn(),
}

const mockContext = {
  currentTime:      0,
  state:            'running',
  sampleRate:       44100,
  destination:      {},
  createOscillator: vi.fn(() => ({ ...mockOscillator })),
  createGain:       vi.fn(() => ({ ...mockGain })),
  createBiquadFilter: vi.fn(() => ({
    type: 'lowpass',
    frequency: { value: 440 },
    Q: { value: 1 },
    connect: vi.fn(),
  })),
  createBuffer:       vi.fn((_ch, size) => ({
    getChannelData: vi.fn(() => new Float32Array(size)),
  })),
  createBufferSource: vi.fn(() => ({
    buffer:  null,
    connect: vi.fn(),
    start:   vi.fn(),
  })),
  resume: vi.fn(() => Promise.resolve()),
}

vi.stubGlobal('AudioContext', vi.fn(() => mockContext))
vi.stubGlobal('window', { AudioContext })

describe('audio state management', () => {
  beforeEach(() => {
    vi.resetModules()
  })

  it('getAudioState returns default state', async () => {
    const { getAudioState } = await import('./audio')
    const s = getAudioState()
    expect(s.muted).toBe(false)
    expect(s.volume).toBe(0.7)
    expect(s.ambientActive).toBe(false)
    expect(s.contextState).toBe('uninitialized')
  })

  it('setVolume clamps to 0-1 range', async () => {
    const { setVolume, getAudioState } = await import('./audio')
    setVolume(1.5)
    expect(getAudioState().volume).toBe(1)
    setVolume(-0.5)
    expect(getAudioState().volume).toBe(0)
    setVolume(0.5)
    expect(getAudioState().volume).toBe(0.5)
  })

  it('mute sets muted to true', async () => {
    const { mute, getAudioState } = await import('./audio')
    mute()
    expect(getAudioState().muted).toBe(true)
  })

  it('unmute sets muted to false', async () => {
    const { mute, unmute, getAudioState } = await import('./audio')
    mute()
    unmute()
    expect(getAudioState().muted).toBe(false)
  })

  it('setAmbientEnabled updates ambientActive', async () => {
    const { setAmbientEnabled, getAudioState } = await import('./audio')
    setAmbientEnabled(true)
    expect(getAudioState().ambientActive).toBe(true)
    setAmbientEnabled(false)
    expect(getAudioState().ambientActive).toBe(false)
  })
})

describe('audio localStorage persistence', () => {
  const localStorageMock = (() => {
    let store: Record<string, string> = {}
    return {
      getItem:    (k: string) => store[k] ?? null,
      setItem:    (k: string, v: string) => { store[k] = v },
      removeItem: (k: string) => { delete store[k] },
      clear:      () => { store = {} },
    }
  })()

  beforeEach(() => {
    vi.stubGlobal('localStorage', localStorageMock)
    localStorageMock.clear()
  })

  it('persistAudioPreferences saves to localStorage', async () => {
    const { setVolume, mute, persistAudioPreferences } = await import('./audio')
    setVolume(0.4)
    mute()
    persistAudioPreferences()
    const stored = JSON.parse(localStorageMock.getItem('nexus:audio') ?? '{}')
    expect(stored.volume).toBe(0.4)
    expect(stored.muted).toBe(true)
  })

  it('loadAudioPreferences restores from localStorage', async () => {
    localStorageMock.setItem('nexus:audio', JSON.stringify({
      muted:  true,
      volume: 0.3,
    }))
    const { loadAudioPreferences, getAudioState } = await import('./audio')
    loadAudioPreferences()
    const s = getAudioState()
    expect(s.muted).toBe(true)
    expect(s.volume).toBe(0.3)
  })

  it('loadAudioPreferences handles malformed JSON silently', async () => {
    localStorageMock.setItem('nexus:audio', 'not-json')
    const { loadAudioPreferences } = await import('./audio')
    expect(() => loadAudioPreferences()).not.toThrow()
  })
})
