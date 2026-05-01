/**
 * NEXUS v2.0 — Web Audio Engine
 * Algorithmic sound generation — zero file dependencies
 * Mode-aware: APEX = Commander, HAVEN = Poet
 * PRD Section 4 (Tech Stack) — replaces Howler entirely
 */

import type { Mode } from '@/types/mode'

// ─── Audio Context Singleton ──────────────────────────
// Single context for entire app lifetime
// Created lazily on first user gesture
let ctx: AudioContext | null = null
let masterGain: GainNode | null = null

/**
 * Get or create the AudioContext singleton.
 * Must be called inside a user gesture handler.
 * Returns null silently if Web Audio unavailable.
 */
function getContext(): AudioContext | null {
  if (typeof window === 'undefined') return null

  if (!ctx) {
    try {
      ctx = new AudioContext()

      // Master gain — global volume control
      masterGain = ctx.createGain()
      masterGain.gain.setValueAtTime(0.4, ctx.currentTime)
      masterGain.connect(ctx.destination)
    } catch {
      return null
    }
  }

  // Resume if suspended (autoplay policy)
  if (ctx.state === 'suspended') {
    void ctx.resume()
  }

  return ctx
}
// ─── Core Synthesis Primitives ────────────────────────

/**
 * Brown noise buffer — warm, low rumble
 * Used in HAVEN mode sounds
 */
function createBrownNoise(audioCtx: AudioContext): AudioBuffer {
  const bufferSize = audioCtx.sampleRate * 0.5
  const buffer = audioCtx.createBuffer(
    1,
    bufferSize,
    audioCtx.sampleRate
  )
  const data = buffer.getChannelData(0)

  let lastOut = 0
  for (let i = 0; i < bufferSize; i++) {
    const white = Math.random() * 2 - 1
    data[i] = (lastOut + 0.02 * white) / 1.02
    lastOut = data[i]
    data[i] *= 3.5
  }

  return buffer
}

/**
 * Pink noise buffer — balanced, natural
 * Used in APEX mode sounds
 */
function createPinkNoise(audioCtx: AudioContext): AudioBuffer {
  const bufferSize = audioCtx.sampleRate * 0.5
  const buffer = audioCtx.createBuffer(
    1,
    bufferSize,
    audioCtx.sampleRate
  )
  const data = buffer.getChannelData(0)

  let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0

  for (let i = 0; i < bufferSize; i++) {
    const white = Math.random() * 2 - 1
    b0 = 0.99886 * b0 + white * 0.0555179
    b1 = 0.99332 * b1 + white * 0.0750759
    b2 = 0.96900 * b2 + white * 0.1538520
    b3 = 0.86650 * b3 + white * 0.3104856
    b4 = 0.55000 * b4 + white * 0.5329522
    b5 = -0.7616 * b5 - white * 0.0168980
    data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11
    b6 = white * 0.115926
  }

  return buffer
}

/**
 * Shaped envelope — attack, sustain, release
 */
function applyEnvelope(
  gainNode: GainNode,
  audioCtx: AudioContext,
  options: {
    attack: number
    sustain: number
    release: number
    peak: number
  }
): void {
  const { attack, sustain, release, peak } = options
  const now = audioCtx.currentTime

  gainNode.gain.setValueAtTime(0, now)
  gainNode.gain.linearRampToValueAtTime(peak, now + attack)
  gainNode.gain.setValueAtTime(peak, now + attack + sustain)
  gainNode.gain.exponentialRampToValueAtTime(
    0.0001,
    now + attack + sustain + release
  )
}

// ─── Sound Definitions ────────────────────────────────

/**
 * UI Click — key interaction feedback
 * APEX: sharp, precise click
 * HAVEN: soft, rounded tap
 */
export function playClick(mode: Mode = 'apex'): void {
  const audioCtx = getContext()
  if (!audioCtx || !masterGain) return

  const osc = audioCtx.createOscillator()
  const gain = audioCtx.createGain()

  osc.connect(gain)
  gain.connect(masterGain)

  if (mode === 'apex') {
    // Sharp click — higher frequency, fast attack
    osc.type = 'square'
    osc.frequency.setValueAtTime(800, audioCtx.currentTime)
    osc.frequency.exponentialRampToValueAtTime(
      200,
      audioCtx.currentTime + 0.04
    )
    applyEnvelope(gain, audioCtx, {
      attack: 0.001,
      sustain: 0.01,
      release: 0.04,
      peak: 0.15,
    })
  } else {
    // Soft tap — lower frequency, gentle attack
    osc.type = 'sine'
    osc.frequency.setValueAtTime(320, audioCtx.currentTime)
    osc.frequency.exponentialRampToValueAtTime(
      160,
      audioCtx.currentTime + 0.08
    )
    applyEnvelope(gain, audioCtx, {
      attack: 0.008,
      sustain: 0.02,
      release: 0.1,
      peak: 0.1,
    })
  }

  osc.start(audioCtx.currentTime)
  osc.stop(audioCtx.currentTime + 0.2)
}

/**
 * Mode transition — cinematic moment
 * APEX→HAVEN: descending tone, warm
 * HAVEN→APEX: ascending tone, bright
 */
export function playModeTransition(
  toMode: Mode
): void {
  const audioCtx = getContext()
  if (!audioCtx || !masterGain) return

  // Layered tones for richness
  const frequencies =
    toMode === 'apex'
      ? [220, 440, 880]   // Ascending — Commander awakens
      : [880, 440, 220]   // Descending — Poet settles

  frequencies.forEach((freq, i) => {
    const osc = audioCtx.createOscillator()
    const gain = audioCtx.createGain()
    const delay = i * 0.08

    osc.connect(gain)
    gain.connect(masterGain!)

    osc.type = toMode === 'apex' ? 'triangle' : 'sine'
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime + delay)

    gain.gain.setValueAtTime(0, audioCtx.currentTime + delay)
    gain.gain.linearRampToValueAtTime(
      0.08,
      audioCtx.currentTime + delay + 0.05
    )
    gain.gain.exponentialRampToValueAtTime(
      0.0001,
      audioCtx.currentTime + delay + 0.6
    )

    osc.start(audioCtx.currentTime + delay)
    osc.stop(audioCtx.currentTime + delay + 0.7)
  })
}

/**
 * AI response begin — Oracle starts speaking
 * Subtle shimmer indicating intelligence activating
 */
export function playOracleActivate(mode: Mode = 'apex'): void {
  const audioCtx = getContext()
  if (!audioCtx || !masterGain) return

  const noiseBuffer =
    mode === 'apex'
      ? createPinkNoise(audioCtx)
      : createBrownNoise(audioCtx)

  const source = audioCtx.createBufferSource()
  source.buffer = noiseBuffer

  // Bandpass filter — shapes noise into a tone
  const filter = audioCtx.createBiquadFilter()
  filter.type = 'bandpass'
  filter.frequency.setValueAtTime(
    mode === 'apex' ? 2400 : 800,
    audioCtx.currentTime
  )
  filter.Q.setValueAtTime(8, audioCtx.currentTime)

  const gain = audioCtx.createGain()
  source.connect(filter)
  filter.connect(gain)
  gain.connect(masterGain)

  applyEnvelope(gain, audioCtx, {
    attack: mode === 'apex' ? 0.02 : 0.08,
    sustain: 0.1,
    release: mode === 'apex' ? 0.15 : 0.4,
    peak: 0.12,
  })

  source.start(audioCtx.currentTime)
  source.stop(audioCtx.currentTime + 0.7)
}

/**
 * Streak milestone — achievement moment
 * Ascending harmonic series — satisfying, earned
 */
export function playStreakMilestone(): void {
  const audioCtx = getContext()
  if (!audioCtx || !masterGain) return

  // Pentatonic ascending — universally satisfying
  const notes = [261.63, 329.63, 392.0, 523.25, 659.25]

  notes.forEach((freq, i) => {
    const osc = audioCtx.createOscillator()
    const gain = audioCtx.createGain()
    const delay = i * 0.06

    osc.connect(gain)
    gain.connect(masterGain!)

    osc.type = 'sine'
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime + delay)

    gain.gain.setValueAtTime(0, audioCtx.currentTime + delay)
    gain.gain.linearRampToValueAtTime(
      0.1,
      audioCtx.currentTime + delay + 0.02
    )
    gain.gain.exponentialRampToValueAtTime(
      0.0001,
      audioCtx.currentTime + delay + 0.4
    )

    osc.start(audioCtx.currentTime + delay)
    osc.stop(audioCtx.currentTime + delay + 0.5)
  })
}

/**
 * Lexicon duel — word accepted / XP earned
 * Sharp confirmation — Commander approves
 */
export function playWordAccepted(): void {
  const audioCtx = getContext()
  if (!audioCtx || !masterGain) return

  const osc = audioCtx.createOscillator()
  const gain = audioCtx.createGain()

  osc.connect(gain)
  gain.connect(masterGain)

  osc.type = 'triangle'
  osc.frequency.setValueAtTime(523.25, audioCtx.currentTime)
  osc.frequency.setValueAtTime(659.25, audioCtx.currentTime + 0.06)

  applyEnvelope(gain, audioCtx, {
    attack: 0.005,
    sustain: 0.04,
    release: 0.15,
    peak: 0.12,
  })

  osc.start(audioCtx.currentTime)
  osc.stop(audioCtx.currentTime + 0.3)
}

/**
 * Protocol ZERO — emergency brake engaged
 * Deep, resonant warning — system halting
 */
export function playProtocolZero(): void {
  const audioCtx = getContext()
  if (!audioCtx || !masterGain) return

  // Sub-bass drone
  const sub = audioCtx.createOscillator()
  const subGain = audioCtx.createGain()
  sub.connect(subGain)
  subGain.connect(masterGain)
  sub.type = 'sine'
  sub.frequency.setValueAtTime(55, audioCtx.currentTime)
  sub.frequency.exponentialRampToValueAtTime(
    27.5,
    audioCtx.currentTime + 1.5
  )

  applyEnvelope(subGain, audioCtx, {
    attack: 0.1,
    sustain: 0.8,
    release: 0.8,
    peak: 0.3,
  })

  // High harmonic — tension
  const high = audioCtx.createOscillator()
  const highGain = audioCtx.createGain()
  high.connect(highGain)
  highGain.connect(masterGain)
  high.type = 'sawtooth'
  high.frequency.setValueAtTime(440, audioCtx.currentTime)
  high.frequency.exponentialRampToValueAtTime(
    110,
    audioCtx.currentTime + 1.5
  )

  applyEnvelope(highGain, audioCtx, {
    attack: 0.05,
    sustain: 0.5,
    release: 1.0,
    peak: 0.06,
  })

  sub.start(audioCtx.currentTime)
  sub.stop(audioCtx.currentTime + 2.0)
  high.start(audioCtx.currentTime)
  high.stop(audioCtx.currentTime + 2.0)
}

/**
 * Journal save — quiet acknowledgment
 * Entry committed to memory
 */
export function playJournalSave(mode: Mode = 'haven'): void {
  const audioCtx = getContext()
  if (!audioCtx || !masterGain) return

  const osc = audioCtx.createOscillator()
  const gain = audioCtx.createGain()

  osc.connect(gain)
  gain.connect(masterGain)

  osc.type = 'sine'
  osc.frequency.setValueAtTime(
    mode === 'haven' ? 392.0 : 523.25,
    audioCtx.currentTime
  )

  applyEnvelope(gain, audioCtx, {
    attack: mode === 'haven' ? 0.04 : 0.01,
    sustain: 0.05,
    release: mode === 'haven' ? 0.5 : 0.2,
    peak: 0.08,
  })

  osc.start(audioCtx.currentTime)
  osc.stop(audioCtx.currentTime + 0.7)
}

// ─── Volume Control ───────────────────────────────────

/**
 * Set master volume — 0.0 to 1.0
 * Called from Settings page
 */
export function setMasterVolume(volume: number): void {
  const audioCtx = getContext()
  if (!audioCtx || !masterGain) return

  const clamped = Math.max(0, Math.min(1, volume))
  masterGain.gain.linearRampToValueAtTime(
    clamped * 0.4,
    audioCtx.currentTime + 0.1
  )
}

/**
 * Mute / unmute master output
 */
export function setMuted(muted: boolean): void {
  const audioCtx = getContext()
  if (!audioCtx || !masterGain) return

  masterGain.gain.linearRampToValueAtTime(
    muted ? 0 : 0.4,
    audioCtx.currentTime + 0.05
  )
}

/**
 * Initialize audio context on first user gesture.
 * Call this in an onClick handler anywhere in the app.
 * Safe to call multiple times — idempotent.
 */
export function initAudio(): void {
  getContext()
}

// ─── Type exports ─────────────────────────────────────
export type AudioEngine = {
  playClick: typeof playClick
  playModeTransition: typeof playModeTransition
  playOracleActivate: typeof playOracleActivate
  playStreakMilestone: typeof playStreakMilestone
  playWordAccepted: typeof playWordAccepted
  playProtocolZero: typeof playProtocolZero
  playJournalSave: typeof playJournalSave
  setMasterVolume: typeof setMasterVolume
  setMuted: typeof setMuted
  initAudio: typeof initAudio
}
