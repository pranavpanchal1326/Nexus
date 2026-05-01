import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import type { Mode, ModePreference, PhysicsConfig } from '@/types/mode'

// ─── State Shape ──────────────────────────────────────
interface NexusState {
  // ─── Mode ────────────────────────────────────────
  /** Active resolved mode — never 'auto' */
  mode: Mode
  /** User preference — may be 'auto' */
  modePreference: ModePreference
  /** True during APEX↔HAVEN cinematic transition */
  isTransitioning: boolean

  // ─── AI ──────────────────────────────────────────
  /** True during any active Groq API call */
  isAiProcessing: boolean

  // ─── UI ──────────────────────────────────────────
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

  // ─── Physics ─────────────────────────────────────
  /** Current mode-aware spring physics */
  physics: PhysicsConfig

  // ─── Actions ─────────────────────────────────────
  setMode: (mode: Mode) => void
  setModePreference: (pref: ModePreference) => void
  setIsTransitioning: (v: boolean) => void
  setIsAiProcessing: (v: boolean) => void
  setIsProtocolZeroActive: (v: boolean) => void
  setIsIntelPanelOpen: (v: boolean) => void
  setIsMuted: (v: boolean) => void
  setVolume: (v: number) => void
  toggleMode: () => void
  toggleMute: () => void
  /** Compatibility alias for setIsIntelPanelOpen */
  toggleIntelPanel: () => void
}

// ─── Store ────────────────────────────────────────────
export const useNexusStore = create<NexusState>()(
  devtools(
    set => ({
      // ─── Defaults ──────────────────────────────
      mode:                 'apex',
      modePreference:       'auto',
      isTransitioning:      false,
      isAiProcessing:       false,
      isProtocolZeroActive: false,
      isIntelPanelOpen:     false,
      intelPanelOpen:       false,
      isMuted:              false,
      volume:               1,
      physics: { stiffness: 500, damping: 40, mass: 0.8 },

      // ─── Actions ───────────────────────────────
      setMode: mode =>
        set(
          state => ({
            mode,
            physics: mode === 'apex'
              ? { stiffness: 500, damping: 40, mass: 0.8 }
              : { stiffness: 180, damping: 28, mass: 1.2 },
          }),
          false,
          'setMode'
        ),

      setModePreference: modePreference =>
        set({ modePreference }, false, 'setModePreference'),

      setIsTransitioning: isTransitioning =>
        set({ isTransitioning }, false, 'setIsTransitioning'),

      setIsAiProcessing: isAiProcessing =>
        set({ isAiProcessing }, false, 'setIsAiProcessing'),

      setIsProtocolZeroActive: isProtocolZeroActive =>
        set({ isProtocolZeroActive }, false, 'setIsProtocolZeroActive'),

      setIsIntelPanelOpen: isIntelPanelOpen =>
        set(
          { isIntelPanelOpen, intelPanelOpen: isIntelPanelOpen },
          false,
          'setIsIntelPanelOpen'
        ),

      setIsMuted: isMuted =>
        set({ isMuted }, false, 'setIsMuted'),

      setVolume: volume =>
        set(
          { volume: Math.max(0, Math.min(1, volume)) },
          false,
          'setVolume'
        ),

      toggleMode: () =>
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

      toggleMute: () =>
        set(
          state => ({ isMuted: !state.isMuted }),
          false,
          'toggleMute'
        ),

      toggleIntelPanel: () =>
        set(
          state => ({
            isIntelPanelOpen: !state.isIntelPanelOpen,
            intelPanelOpen: !state.isIntelPanelOpen,
          }),
          false,
          'toggleIntelPanel'
        ),
    }),
    { name: 'nexus-store' }
  )
)

// ─── Selector Hooks — avoid re-render on unrelated state ──
export const useMode = (): Mode =>
  useNexusStore(s => s.mode)

export const useIsAiProcessing = (): boolean =>
  useNexusStore(s => s.isAiProcessing)

export const useIsTransitioning = (): boolean =>
  useNexusStore(s => s.isTransitioning)
