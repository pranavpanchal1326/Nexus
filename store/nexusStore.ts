import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import type { Mode, ModePreference, PhysicsConfig } from '@/types/mode'

// ─── State Shape ──────────────────────────────────────────────────────────────
interface NexusState {
  // ─── Mode ────────────────────────────────────────────────────────────────
  /** Active resolved mode — never 'auto' */
  mode: Mode
  /** User preference — may be 'auto' */
  modePreference: ModePreference
  /** True during APEX↔HAVEN cinematic transition */
  isTransitioning: boolean

  // ─── AI — signal dot lifecycle ───────────────────────────────────────────
  /**
   * True while any Groq API call is in-flight.
   * Derived from requestCount — never set directly.
   */
  signalActive: boolean
  /**
   * Count of concurrent in-flight Groq requests.
   * signalActive = requestCount > 0
   */
  requestCount: number
  /** Call before each Groq request begins. */
  signalStart: () => void
  /** Call after each Groq request completes or errors (always in finally). */
  signalStop: () => void

  /**
   * Legacy alias — kept for any existing code using isAiProcessing.
   * Mirrors signalActive. Prefer signalActive for new code.
   * @deprecated Use signalActive
   */
  isAiProcessing: boolean
  /** @deprecated Use signalStart / signalStop */
  setIsAiProcessing: (v: boolean) => void

  // ─── UI ──────────────────────────────────────────────────────────────────
  /** Protocol ZERO emergency brake active */
  isProtocolZeroActive: boolean
  /** Right intel panel open on tablet */
  isIntelPanelOpen: boolean
  /** Compatibility alias for isIntelPanelOpen */
  intelPanelOpen: boolean
  /** Master audio muted */
  isMuted: boolean
  /** Master volume 0–1 */
  volume: number

  // ─── Physics ─────────────────────────────────────────────────────────────
  /** Current mode-aware spring physics */
  physics: PhysicsConfig

  // ─── Actions ─────────────────────────────────────────────────────────────
  setMode:                 (mode: Mode) => void
  setModePreference:       (pref: ModePreference) => void
  setIsTransitioning:      (v: boolean) => void
  setIsProtocolZeroActive: (v: boolean) => void
  setIsIntelPanelOpen:     (v: boolean) => void
  setIsMuted:              (v: boolean) => void
  setVolume:               (v: number) => void
  toggleMode:              () => void
  toggleMute:              () => void
  /** Compatibility alias for setIsIntelPanelOpen */
  toggleIntelPanel: () => void
}

// ─── Store ────────────────────────────────────────────────────────────────────
export const useNexusStore = create<NexusState>()(
  devtools(
    (set): NexusState => ({
      // ─── Defaults ──────────────────────────────────────────────────────
      mode:                 'apex',
      modePreference:       'auto',
      isTransitioning:      false,
      isProtocolZeroActive: false,
      isIntelPanelOpen:     false,
      intelPanelOpen:       false,
      isMuted:              false,
      volume:               1,
      physics: { stiffness: 500, damping: 40, mass: 0.8 },

      // ─── Signal dot lifecycle ───────────────────────────────────────────
      signalActive: false,
      requestCount: 0,
      isAiProcessing: false,   // legacy mirror

      signalStart: () =>
        set(
          state => ({
            requestCount:  state.requestCount + 1,
            signalActive:  true,
            isAiProcessing: true,
          }),
          false,
          'signalStart'
        ),

      signalStop: () =>
        set(
          state => {
            const newCount = Math.max(0, state.requestCount - 1)
            return {
              requestCount:  newCount,
              signalActive:  newCount > 0,
              isAiProcessing: newCount > 0,
            }
          },
          false,
          'signalStop'
        ),

      setIsAiProcessing: (isAiProcessing: boolean): void =>
        set({ isAiProcessing }, false, 'setIsAiProcessing'),

      // ─── Mode ──────────────────────────────────────────────────────────
      setMode: (mode: Mode): void =>
        set(
          (): Partial<NexusState> => ({
            mode,
            physics: mode === 'apex'
              ? { stiffness: 500, damping: 40, mass: 0.8 }
              : { stiffness: 180, damping: 28, mass: 1.2 },
          }),
          false,
          'setMode'
        ),

      setModePreference: (modePreference: ModePreference): void =>
        set({ modePreference }, false, 'setModePreference'),

      setIsTransitioning: (isTransitioning: boolean): void =>
        set({ isTransitioning }, false, 'setIsTransitioning'),

      setIsProtocolZeroActive: (isProtocolZeroActive: boolean): void =>
        set({ isProtocolZeroActive }, false, 'setIsProtocolZeroActive'),

      setIsIntelPanelOpen: (isIntelPanelOpen: boolean): void =>
        set(
          { isIntelPanelOpen, intelPanelOpen: isIntelPanelOpen },
          false,
          'setIsIntelPanelOpen'
        ),

      setIsMuted: (isMuted: boolean): void =>
        set({ isMuted }, false, 'setIsMuted'),

      setVolume: (volume: number): void =>
        set(
          { volume: Math.max(0, Math.min(1, volume)) },
          false,
          'setVolume'
        ),

      toggleMode: (): void =>
        set(
          state => {
            const nextMode = state.mode === 'apex' ? 'haven' : 'apex'
            return {
              mode: nextMode,
              physics: nextMode === 'apex'
                ? { stiffness: 500, damping: 40, mass: 0.8 }
                : { stiffness: 180, damping: 28, mass: 1.2 },
            }
          },
          false,
          'toggleMode'
        ),

      toggleMute: (): void =>
        set(
          state => ({ isMuted: !state.isMuted }),
          false,
          'toggleMute'
        ),

      toggleIntelPanel: (): void =>
        set(
          state => ({
            isIntelPanelOpen: !state.isIntelPanelOpen,
            intelPanelOpen:   !state.isIntelPanelOpen,
          }),
          false,
          'toggleIntelPanel'
        ),
    }),
    { name: 'nexus-store', enabled: process.env.NODE_ENV === 'development' }
  )
)

// ─── Selector Hooks — avoid re-render on unrelated state ─────────────────────
// Use these instead of useNexusStore(state => state.x) for performance

export const useMode = (): Mode =>
  useNexusStore(s => s.mode)

/** True while any Groq request is in-flight */
export const useSignal = (): boolean =>
  useNexusStore(s => s.signalActive)

/** signalStart action — stable reference */
export const useSignalStart = (): (() => void) =>
  useNexusStore(s => s.signalStart)

/** signalStop action — stable reference */
export const useSignalStop = (): (() => void) =>
  useNexusStore(s => s.signalStop)

export const usePhysics = (): PhysicsConfig =>
  useNexusStore(s => s.physics)

/** @deprecated Use useSignal */
export const useIsAiProcessing = (): boolean =>
  useNexusStore(s => s.isAiProcessing)

export const useIsTransitioning = (): boolean =>
  useNexusStore(s => s.isTransitioning)
