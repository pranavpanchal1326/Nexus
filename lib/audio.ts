/**
 * NEXUS v2.0 — Web Audio Engine
 * Pure algorithmic synthesis — zero audio file dependencies
 * All sounds generated from oscillators, noise buffers, and filters
 * Server-safe — all audio code guarded by isBrowser checks
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export type SoundId =
  | 'mode-apex'
  | 'mode-haven'
  | 'protocol-zero'
  | 'nav-tap'
  | 'button-press'
  | 'modal-open'
  | 'modal-close'
  | 'journal-save'
  | 'gym-log'
  | 'duel-start'
  | 'duel-win'
  | 'duel-lose'
  | 'oracle-start'
  | 'word-appear'
  | 'streak-milestone'

export type AudioMode = 'apex' | 'haven'

interface AudioEngineState {
  context:        AudioContext | null
  masterGain:     GainNode | null
  ambientNodes:   AudioNode[]
  muted:          boolean
  volume:         number   // 0–1
  ambientActive:  boolean
}

// ─── Singleton state ──────────────────────────────────────────────────────────

const state: AudioEngineState = {
  context:       null,
  masterGain:    null,
  ambientNodes:  [],
  muted:         false,
  volume:        0.7,
  ambientActive: false,
}

// ─── Constants ────────────────────────────────────────────────────────────────

const isBrowser = typeof window !== 'undefined'

// All volumes relative to master — quiet by default
// NEXUS sounds confirm, they do not announce
const VOLUMES = {
  'mode-apex':        0.08,
  'mode-haven':       0.06,
  'protocol-zero':    0.15,
  'nav-tap':          0.04,
  'button-press':     0.05,
  'modal-open':       0.04,
  'modal-close':      0.03,
  'journal-save':     0.07,
  'gym-log':          0.06,
  'duel-start':       0.08,
  'duel-win':         0.09,
  'duel-lose':        0.05,
  'oracle-start':     0.05,
  'word-appear':      0.02,
  'streak-milestone': 0.10,
} as const

// ─── AudioContext management ──────────────────────────────────────────────────

/**
 * Get or create AudioContext.
 * Must be called from a user gesture on first use.
 * Subsequent calls return the same context.
 */
function getContext(): AudioContext | null {
  if (!isBrowser) return null

  try {
    if (!state.context) {
      state.context   = new AudioContext()
      state.masterGain = state.context.createGain()
      state.masterGain.gain.value = state.muted ? 0 : state.volume
      state.masterGain.connect(state.context.destination)
    }

    // Resume if suspended — browsers suspend AudioContext until user gesture
    if (state.context.state === 'suspended') {
      state.context.resume().catch(() => {/* silent */})
    }

    return state.context
  } catch {
    return null
  }
}

/**
 * Connect a node through master gain.
 * All sounds route through master for global volume/mute control.
 */
function connectToMaster(node: AudioNode): void {
  if (state.masterGain) node.connect(state.masterGain)
}

// ─── Primitive synthesis building blocks ──────────────────────────────────────

/**
 * Create a simple oscillator with gain envelope.
 * The most common synthesis primitive in NEXUS.
 */
function createOscillatorTone(
  ctx:      AudioContext,
  freq:     number,
  type:     OscillatorType,
  attack:   number,
  decay:    number,
  peak:     number,
  start:    number = ctx.currentTime
): void {
  const osc  = ctx.createOscillator()
  const gain = ctx.createGain()

  osc.type = type
  osc.frequency.setValueAtTime(freq, start)

  gain.gain.setValueAtTime(0, start)
  gain.gain.linearRampToValueAtTime(peak, start + attack)
  gain.gain.exponentialRampToValueAtTime(0.0001, start + attack + decay)

  osc.connect(gain)
  connectToMaster(gain)

  osc.start(start)
  osc.stop(start + attack + decay + 0.01)
}

/**
 * Create a frequency-swept oscillator.
 * Used for APEX rising tones — directional, driven upward.
 */
function createFrequencySweep(
  ctx:      AudioContext,
  freqFrom: number,
  freqTo:   number,
  type:     OscillatorType,
  duration: number,
  peak:     number,
  start:    number = ctx.currentTime
): void {
  const osc  = ctx.createOscillator()
  const gain = ctx.createGain()

  osc.type = type
  osc.frequency.setValueAtTime(freqFrom, start)
  osc.frequency.exponentialRampToValueAtTime(freqTo, start + duration)

  gain.gain.setValueAtTime(0, start)
  gain.gain.linearRampToValueAtTime(peak, start + 0.01)
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration)

  osc.connect(gain)
  connectToMaster(gain)

  osc.start(start)
  osc.stop(start + duration + 0.05)
}

/**
 * Create a white/brown noise burst.
 * Used for percussive sounds — gym log, button press confirmations.
 */
function createNoiseBurst(
  ctx:      AudioContext,
  duration: number,
  peak:     number,
  color:    'white' | 'brown' = 'white',
  start:    number = ctx.currentTime
): void {
  const bufferSize = ctx.sampleRate * duration
  const buffer     = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
  const data       = buffer.getChannelData(0)

  if (color === 'white') {
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1)
    }
  } else {
    // Brown noise — integrate white noise for warmer character
    let lastOut = 0
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1
      lastOut = (lastOut + 0.02 * white) / 1.02
      data[i] = lastOut * 3.5
    }
  }

  const source  = ctx.createBufferSource()
  const gain    = ctx.createGain()
  const filter  = ctx.createBiquadFilter()

  source.buffer = buffer

  // High-pass filter for white — removes low-end rumble
  // Low-pass filter for brown — keeps warmth, removes harshness
  filter.type            = color === 'white' ? 'highpass' : 'lowpass'
  filter.frequency.value = color === 'white' ? 2000 : 400

  gain.gain.setValueAtTime(peak, start)
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration)

  source.connect(filter)
  filter.connect(gain)
  connectToMaster(gain)

  source.start(start)
}

/**
 * Create a chord — multiple oscillators at harmonic intervals.
 * Used for HAVEN mode sounds — warm, resonant, multiple harmonics.
 */
function createChord(
  ctx:         AudioContext,
  frequencies: number[],
  type:        OscillatorType,
  attack:      number,
  decay:       number,
  peak:        number,
  start:       number = ctx.currentTime
): void {
  frequencies.forEach((freq, i) => {
    createOscillatorTone(
      ctx,
      freq,
      type,
      attack + i * 0.04,      // stagger entry slightly — natural chord voicing
      decay,
      peak / frequencies.length,
      start + i * 0.02,
    )
  })
}

// ─── Individual sound implementations ────────────────────────────────────────

const SOUNDS: Record<SoundId, (ctx: AudioContext, vol: number) => void> = {

  // ─── APEX mode activation ─────────────────────────────────────────────────
  // Rising frequency sweep — directional, cold, Commander authority
  'mode-apex': (ctx, vol) => {
    createFrequencySweep(ctx, 220, 440, 'sine', 0.3,  vol, ctx.currentTime)
    createFrequencySweep(ctx, 110, 220, 'sine', 0.35, vol * 0.4, ctx.currentTime + 0.05)
    // High harmonic shimmer
    createFrequencySweep(ctx, 880, 1320, 'sine', 0.2, vol * 0.15, ctx.currentTime + 0.1)
  },

  // ─── HAVEN mode activation ───────────────────────────────────────────────
  // Descending chord — warm, resonant, Poet arrival
  'mode-haven': (ctx, vol) => {
    createChord(ctx, [330, 220, 165, 110], 'sine', 0.08, 0.8, vol, ctx.currentTime)
    // Warm sub presence
    createOscillatorTone(ctx, 55, 'sine', 0.1, 1.0, vol * 0.3, ctx.currentTime + 0.1)
  },

  // ─── Protocol ZERO ────────────────────────────────────────────────────────
  // Deep sub-bass impact — system stopping, world pausing
  'protocol-zero': (ctx, vol) => {
    createFrequencySweep(ctx, 80, 30, 'sine', 0.35, vol, ctx.currentTime)
    // Noise burst — physical impact feeling
    createNoiseBurst(ctx, 0.15, vol * 0.4, 'brown', ctx.currentTime)
    // High click — precision
    createOscillatorTone(ctx, 2000, 'sine', 0.005, 0.08, vol * 0.2, ctx.currentTime)
  },

  // ─── Navigation tap ──────────────────────────────────────────────────────
  // Minimal click — spatial confirmation without announcing
  'nav-tap': (ctx, vol) => {
    createOscillatorTone(ctx, 600, 'sine', 0.004, 0.06, vol, ctx.currentTime)
    createOscillatorTone(ctx, 1200, 'sine', 0.003, 0.04, vol * 0.3, ctx.currentTime)
  },

  // ─── Button press ─────────────────────────────────────────────────────────
  // Slightly fuller than nav tap — more deliberate action
  'button-press': (ctx, vol) => {
    createOscillatorTone(ctx, 440, 'sine', 0.005, 0.1, vol, ctx.currentTime)
    createNoiseBurst(ctx, 0.04, vol * 0.3, 'white', ctx.currentTime)
  },

  // ─── Modal open ───────────────────────────────────────────────────────────
  // Rising sine — content arriving
  'modal-open': (ctx, vol) => {
    createFrequencySweep(ctx, 300, 500, 'sine', 0.15, vol, ctx.currentTime)
  },

  // ─── Modal close ──────────────────────────────────────────────────────────
  // Falling sine — content departing
  'modal-close': (ctx, vol) => {
    createFrequencySweep(ctx, 500, 300, 'sine', 0.12, vol * 0.7, ctx.currentTime)
  },

  // ─── Journal save ─────────────────────────────────────────────────────────
  // Two-tone confirmation — thought committed to record
  // Deliberately satisfying — this is an important moment
  'journal-save': (ctx, vol) => {
    createOscillatorTone(ctx, 440, 'sine', 0.01, 0.2, vol, ctx.currentTime)
    createOscillatorTone(ctx, 660, 'sine', 0.01, 0.25, vol * 0.7, ctx.currentTime + 0.08)
    // Soft noise tail — paper rustling
    createNoiseBurst(ctx, 0.3, vol * 0.15, 'brown', ctx.currentTime + 0.05)
  },

  // ─── Gym log ──────────────────────────────────────────────────────────────
  // Percussive noise + low thud — physical, mechanical, weighted
  'gym-log': (ctx, vol) => {
    createOscillatorTone(ctx, 80, 'sine', 0.005, 0.2, vol, ctx.currentTime)
    createNoiseBurst(ctx, 0.08, vol * 0.5, 'white', ctx.currentTime)
    // Second impact — like weight returning to rack
    createOscillatorTone(ctx, 60, 'sine', 0.003, 0.15, vol * 0.4, ctx.currentTime + 0.05)
  },

  // ─── Duel start ───────────────────────────────────────────────────────────
  // Tension build — two ascending tones, combat initiated
  'duel-start': (ctx, vol) => {
    createFrequencySweep(ctx, 200, 400, 'sawtooth', 0.2, vol * 0.4, ctx.currentTime)
    createFrequencySweep(ctx, 150, 300, 'sawtooth', 0.25, vol * 0.3, ctx.currentTime + 0.1)
    // Filter noise for dramatic effect
    const bufferSize = ctx.sampleRate * 0.3
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
    const data   = buffer.getChannelData(0)
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1
    const source = ctx.createBufferSource()
    const filter = ctx.createBiquadFilter()
    const gain   = ctx.createGain()
    source.buffer = buffer
    filter.type   = 'bandpass'
    filter.frequency.value = 800
    filter.Q.value         = 5
    gain.gain.setValueAtTime(vol * 0.2, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.3)
    source.connect(filter)
    filter.connect(gain)
    connectToMaster(gain)
    source.start(ctx.currentTime)
  },

  // ─── Duel win ─────────────────────────────────────────────────────────────
  // Major arpeggio — victory, ascending intelligence
  'duel-win': (ctx, vol) => {
    const notes = [261.63, 329.63, 392.00, 523.25]  // C4 E4 G4 C5 — major chord
    notes.forEach((freq, i) => {
      createOscillatorTone(
        ctx, freq, 'sine',
        0.01, 0.3,
        vol * (1 - i * 0.1),
        ctx.currentTime + i * 0.07
      )
    })
    // Signal shimmer at top
    createOscillatorTone(ctx, 1046.5, 'sine', 0.005, 0.4, vol * 0.3, ctx.currentTime + 0.28)
  },

  // ─── Duel lose ────────────────────────────────────────────────────────────
  // Descending minor — not harsh, just honest
  'duel-lose': (ctx, vol) => {
    const notes = [392.00, 311.13, 261.63]  // G4 Eb4 C4 — minor fall
    notes.forEach((freq, i) => {
      createOscillatorTone(
        ctx, freq, 'sine',
        0.01, 0.35,
        vol * 0.7,
        ctx.currentTime + i * 0.09
      )
    })
  },

  // ─── Oracle session open ──────────────────────────────────────────────────
  // Slow breath — intelligence awakening, the system turning toward you
  'oracle-start': (ctx, vol) => {
    createFrequencySweep(ctx, 80, 160, 'sine', 0.6, vol * 0.5, ctx.currentTime)
    createOscillatorTone(ctx, 320, 'sine', 0.2, 0.5, vol * 0.3, ctx.currentTime + 0.3)
    // Harmonic shimmer
    createOscillatorTone(ctx, 640, 'sine', 0.1, 0.6, vol * 0.1, ctx.currentTime + 0.4)
  },

  // ─── Word appear ──────────────────────────────────────────────────────────
  // Ultra minimal — one per word as oracle text materializes
  // Must be inaudible in isolation, textural in accumulation
  'word-appear': (ctx, vol) => {
    const freq = 800 + Math.random() * 400  // slight pitch variation per word
    createOscillatorTone(ctx, freq, 'sine', 0.002, 0.04, vol, ctx.currentTime)
  },

  // ─── Streak milestone ─────────────────────────────────────────────────────
  // Full chord + shimmer — rare, celebratory, earned
  // Only fires at 7, 30, 100 day streaks
  'streak-milestone': (ctx, vol) => {
    // Base chord — rich, resonant
    createChord(ctx, [130.81, 164.81, 196.00, 261.63], 'sine', 0.05, 1.0, vol, ctx.currentTime)
    // Upper octave shimmer
    createChord(ctx, [523.25, 659.25, 783.99], 'sine', 0.08, 0.8, vol * 0.5, ctx.currentTime + 0.1)
    // Sub presence
    createOscillatorTone(ctx, 65.41, 'sine', 0.1, 1.2, vol * 0.4, ctx.currentTime)
    // Noise sparkle at top
    createNoiseBurst(ctx, 0.5, vol * 0.15, 'white', ctx.currentTime + 0.15)
  },
}

// ─── Ambient sound engine ─────────────────────────────────────────────────────

let apexAmbientNodes:  AudioNode[] = []
let havenAmbientNodes: AudioNode[] = []

/**
 * Start APEX ambient — very low frequency hum, barely perceptible
 * Engineered precision — like server room tone
 */
function startApexAmbient(ctx: AudioContext): void {
  if (!state.masterGain) return

  // Low sine oscillator — 60Hz, like transformer hum
  const osc  = ctx.createOscillator()
  const gain = ctx.createGain()
  const filter = ctx.createBiquadFilter()

  osc.type           = 'sine'
  osc.frequency.value = 60

  filter.type            = 'lowpass'
  filter.frequency.value = 120

  gain.gain.setValueAtTime(0, ctx.currentTime)
  gain.gain.linearRampToValueAtTime(0.008, ctx.currentTime + 2.0)

  osc.connect(filter)
  filter.connect(gain)
  if (state.masterGain) gain.connect(state.masterGain)

  osc.start(ctx.currentTime)
  apexAmbientNodes = [osc, gain, filter]
}

/**
 * Start HAVEN ambient — warm low-frequency pad
 * Gentle, resonant, like distant cello
 */
function startHavenAmbient(ctx: AudioContext): void {
  if (!state.masterGain) return

  const frequencies = [55, 82.5, 110]  // A1 E2 A2 — open fifth drone

  frequencies.forEach((freq, i) => {
    const osc    = ctx.createOscillator()
    const gain   = ctx.createGain()
    const filter = ctx.createBiquadFilter()

    osc.type           = 'sine'
    osc.frequency.value = freq

    // Slow vibrato — alive feeling
    const lfo        = ctx.createOscillator()
    const lfoGain    = ctx.createGain()
    lfo.frequency.value  = 0.3 + i * 0.07    // slight rate variation
    lfoGain.gain.value   = 0.5               // vibrato depth in Hz

    lfo.connect(lfoGain)
    lfoGain.connect(osc.frequency)

    filter.type            = 'lowpass'
    filter.frequency.value = 300

    const targetVol = 0.005 / (i + 1)
    gain.gain.setValueAtTime(0, ctx.currentTime)
    gain.gain.linearRampToValueAtTime(targetVol, ctx.currentTime + 3.0 + i * 0.5)

    osc.connect(filter)
    filter.connect(gain)
    if (state.masterGain) gain.connect(state.masterGain)

    osc.start(ctx.currentTime)
    lfo.start(ctx.currentTime)

    havenAmbientNodes.push(osc, gain, filter, lfo, lfoGain)
  })
}

function stopAmbientNodes(nodes: AudioNode[], ctx: AudioContext): void {
  nodes.forEach(node => {
    try {
      if (node instanceof OscillatorNode) {
        node.stop(ctx.currentTime + 1.0)  // fade before stop
      } else if (node instanceof GainNode) {
        node.gain.linearRampToValueAtTime(0, ctx.currentTime + 1.0)
      }
    } catch {/* already stopped */}
  })
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Play a sound by ID.
 * Must be called from a user gesture context on first call.
 * Subsequent calls work without gesture.
 */
export function playSound(id: SoundId): void {
  if (!isBrowser || state.muted) return

  const ctx = getContext()
  if (!ctx) return

  const volume = VOLUMES[id] * state.volume

  try {
    SOUNDS[id](ctx, volume)
  } catch (err) {
    if (process.env.NODE_ENV === 'development') {
      console.warn(`[NEXUS Audio] Failed to play sound: ${id}`, err)
    }
  }
}

/**
 * Play mode transition sound.
 * Exported separately for ModeTransition component (Phase 2E).
 */
export function playModeTransition(mode: AudioMode): void {
  playSound(mode === 'apex' ? 'mode-apex' : 'mode-haven')
}

/**
 * Play Protocol ZERO sound.
 * Exported separately for ProtocolZero component (Phase 2E).
 */
export function playProtocolZero(): void {
  playSound('protocol-zero')
}

/**
 * Start ambient sound layer for current mode.
 * Optional — requires user to have enabled ambient audio.
 */
export function startAmbient(mode: AudioMode): void {
  if (!isBrowser || !state.ambientActive) return

  const ctx = getContext()
  if (!ctx) return

  stopAmbient()

  try {
    if (mode === 'apex') startApexAmbient(ctx)
    else                  startHavenAmbient(ctx)
  } catch {/* silent */}
}

/**
 * Stop all ambient audio immediately with fade.
 */
export function stopAmbient(): void {
  if (!isBrowser) return

  const ctx = state.context
  if (!ctx) return

  stopAmbientNodes(apexAmbientNodes,  ctx)
  stopAmbientNodes(havenAmbientNodes, ctx)

  apexAmbientNodes  = []
  havenAmbientNodes = []
}

/**
 * Set master volume — 0 to 1.
 */
export function setVolume(volume: number): void {
  state.volume = Math.max(0, Math.min(1, volume))
  if (state.masterGain && !state.muted) {
    state.masterGain.gain.setTargetAtTime(state.volume, state.context!.currentTime, 0.1)
  }
}

/**
 * Mute all audio instantly.
 */
export function mute(): void {
  state.muted = true
  if (state.masterGain && state.context) {
    state.masterGain.gain.setTargetAtTime(0, state.context.currentTime, 0.05)
  }
}

/**
 * Unmute — restore to previous volume.
 */
export function unmute(): void {
  state.muted = false
  if (state.masterGain && state.context) {
    state.masterGain.gain.setTargetAtTime(state.volume, state.context.currentTime, 0.1)
  }
}

/**
 * Enable or disable ambient audio layer.
 */
export function setAmbientEnabled(enabled: boolean, mode?: AudioMode): void {
  state.ambientActive = enabled
  if (enabled && mode) startAmbient(mode)
  else stopAmbient()
}

/**
 * Get current audio engine state — for settings UI.
 */
export function getAudioState(): {
  muted:         boolean
  volume:        number
  ambientActive: boolean
  contextState:  AudioContextState | 'uninitialized'
} {
  return {
    muted:        state.muted,
    volume:       state.volume,
    ambientActive: state.ambientActive,
    contextState: state.context?.state ?? 'uninitialized',
  }
}

/**
 * Initialize audio engine on first user interaction.
 * Call this from a click handler to unblock AudioContext.
 * Subsequent playSound calls work without calling this.
 */
export function initAudio(): void {
  getContext()
}

/**
 * Persist audio preferences to localStorage.
 */
export function persistAudioPreferences(): void {
  if (!isBrowser) return
  try {
    localStorage.setItem('nexus:audio', JSON.stringify({
      muted:         state.muted,
      volume:        state.volume,
      ambientActive: state.ambientActive,
    }))
  } catch {/* silent */}
}

/**
 * Load audio preferences from localStorage.
 */
export function loadAudioPreferences(): void {
  if (!isBrowser) return
  try {
    const stored = localStorage.getItem('nexus:audio')
    if (!stored) return
    const prefs = JSON.parse(stored) as {
      muted?:         boolean
      volume?:        number
      ambientActive?: boolean
    }
    if (typeof prefs.muted   === 'boolean') state.muted   = prefs.muted
    if (typeof prefs.volume  === 'number')  state.volume  = prefs.volume
    if (typeof prefs.ambientActive === 'boolean') state.ambientActive = prefs.ambientActive
  } catch {/* silent */}
}
