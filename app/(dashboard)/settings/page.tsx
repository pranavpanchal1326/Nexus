'use client'
import { useState, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import { useNexusStore } from '@/store/nexusStore'
import { BlackBox } from '@/components/modules/BlackBox'
import { PageWrapper, Button, Input, Divider } from '@/components/ui'
import { getAudioState, setVolume, mute, unmute, setAmbientEnabled as setAmbientEnabledAudio } from '@/lib/audio'
import { SPRING, CARD_REVEAL_VARIANTS, STAGGER_CONTAINER_VARIANTS } from '@/lib/motion'
import type { PreferredMode } from '@/hooks/useTimeMode'

// ─── Types ────────────────────────────────────────────────────────────────────

interface ProfileData {
  display_name: string
  preferred_mode: PreferredMode
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const mode = useNexusStore(state => state.mode)
  const setMode = useNexusStore(state => state.setMode)

  // ─── Profile state ────────────────────────────────────────────────────────
  const [profile, setProfile] = useState<ProfileData>({
    display_name: '',
    preferred_mode: 'auto',
  })
  const [isSavingProfile, setIsSavingProfile] = useState(false)
  const [profileSaved, setProfileSaved] = useState(false)
  const [profileError, setProfileError] = useState<string | null>(null)

  // ─── Audio state ──────────────────────────────────────────────────────────
  const [isMuted, setIsMuted] = useState(false)
  const [volume, setVolumeState] = useState(0.7)
  const [ambientEnabled, setAmbientEnabledState] = useState(false)

  // ─── Auth state ───────────────────────────────────────────────────────────
  const [userEmail, setUserEmail] = useState<string>('')

  // ─── Load data on mount ───────────────────────────────────────────────────

  useEffect(() => {
    const loadProfile = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      setUserEmail(user.email ?? '')

      const { data } = await supabase
        .from('profiles')
        .select('display_name, preferred_mode')
        .eq('id', user.id)
        .single()

      if (data) {
        setProfile({
          display_name: data.display_name ?? '',
          preferred_mode: (data.preferred_mode ?? 'auto') as PreferredMode,
        })
      }
    }

    const audioState = getAudioState()
    setIsMuted(audioState.muted)
    setVolumeState(audioState.volume)
    setAmbientEnabledState(audioState.ambientActive)

    loadProfile()
  }, [])

  // ─── Save profile ─────────────────────────────────────────────────────────

  const handleSaveProfile = useCallback(async () => {
    setIsSavingProfile(true)
    setProfileError(null)
    setProfileSaved(false)

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { error } = await supabase
        .from('profiles')
        .update({
          display_name: profile.display_name.trim() || null,
          preferred_mode: profile.preferred_mode,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id)

      if (error) throw error

      setProfileSaved(true)
      setTimeout(() => setProfileSaved(false), 3000)
    } catch (err) {
      setProfileError(err instanceof Error ? err.message : 'Save failed')
    } finally {
      setIsSavingProfile(false)
    }
  }, [profile])

  // ─── Mode preference change ───────────────────────────────────────────────

  const handleModeChange = useCallback((newMode: PreferredMode) => {
    setProfile(prev => ({ ...prev, preferred_mode: newMode }))
    if (newMode !== 'auto') {
      setMode(newMode as 'apex' | 'haven')
    }
  }, [setMode])

  // ─── Audio handlers ───────────────────────────────────────────────────────

  const handleMuteToggle = useCallback(() => {
    if (isMuted) {
      unmute()
      setIsMuted(false)
    } else {
      mute()
      setIsMuted(true)
    }
  }, [isMuted])

  const handleVolumeChange = useCallback((val: number) => {
    setVolumeState(val)
    setVolume(val)
  }, [])

  const handleAmbientToggle = useCallback(() => {
    const next = !ambientEnabled
    setAmbientEnabledState(next)
    setAmbientEnabledAudio(next, mode)
  }, [ambientEnabled, mode])

  // ─── Sign out ─────────────────────────────────────────────────────────────

  const handleSignOut = useCallback(async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    window.location.href = '/login'
  }, [])

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <PageWrapper title="Settings" subtitle="System configuration">
      <motion.div
        className="settings-layout"
        variants={STAGGER_CONTAINER_VARIANTS}
        initial="hidden"
        animate="visible"
      >

        {/* ─── Profile ──────────────────────────────────────────────────── */}
        <motion.section
          className="settings-section card card--pad-lg"
          variants={CARD_REVEAL_VARIANTS}
        >
          <h2 className="settings-section__title text-label">PROFILE</h2>

          {userEmail && (
            <div className="settings-field">
              <span className="settings-field__label text-label">EMAIL</span>
              <span className="settings-field__value">{userEmail}</span>
            </div>
          )}

          <div className="settings-field">
            <Input
              label="DISPLAY NAME"
              value={profile.display_name}
              onChange={e => setProfile(prev => ({
                ...prev,
                display_name: e.target.value,
              }))}
              placeholder="How the system greets you"
              maxLength={50}
            />
          </div>

          {profileError && (
            <div className="settings-error">{profileError}</div>
          )}

          <div className="settings-section__actions">
            <AnimatePresence mode="wait">
              {profileSaved ? (
                <motion.span
                  key="saved"
                  className="settings-saved-indicator"
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  PROFILE SAVED
                </motion.span>
              ) : null}
            </AnimatePresence>

            <Button
              variant="signal"
              size="sm"
              onClick={handleSaveProfile}
              loading={isSavingProfile}
              disabled={isSavingProfile}
            >
              SAVE PROFILE
            </Button>
          </div>
        </motion.section>

        {/* ─── Intelligence Mode ─────────────────────────────────────────── */}
        <motion.section
          className="settings-section card card--pad-lg"
          variants={CARD_REVEAL_VARIANTS}
        >
          <h2 className="settings-section__title text-label">
            INTELLIGENCE MODE
          </h2>
          <p className="settings-section__description">
            Controls whether NEXUS automatically detects your circadian
            window or locks to a specific persona.
          </p>

          <div className="settings-mode-options">
            {([
              {
                value: 'auto',
                label: 'AUTO',
                desc: 'Circadian detection — APEX 05:00–13:00, HAVEN 13:00–05:00',
              },
              {
                value: 'apex',
                label: 'APEX',
                desc: 'Always Commander mode — regardless of time',
              },
              {
                value: 'haven',
                label: 'HAVEN',
                desc: 'Always Poet mode — regardless of time',
              },
            ] as { value: PreferredMode; label: string; desc: string }[]).map(opt => (
              <motion.button
                key={opt.value}
                className={`settings-mode-option ${
                  profile.preferred_mode === opt.value
                    ? 'settings-mode-option--active'
                    : ''
                }`}
                onClick={() => handleModeChange(opt.value)}
                whileTap={{ scale: 0.98 }}
                transition={SPRING.SNAP}
              >
                <div className="settings-mode-option__top">
                  <span className="settings-mode-option__label">{opt.label}</span>
                  {profile.preferred_mode === opt.value && (
                    <span className="settings-mode-option__check">✓</span>
                  )}
                </div>
                <span className="settings-mode-option__desc">{opt.desc}</span>
              </motion.button>
            ))}
          </div>
        </motion.section>

        {/* ─── Audio ────────────────────────────────────────────────────── */}
        <motion.section
          className="settings-section card card--pad-lg"
          variants={CARD_REVEAL_VARIANTS}
        >
          <h2 className="settings-section__title text-label">AUDIO</h2>

          <div className="settings-toggle-row">
            <div className="settings-toggle-info">
              <span className="settings-toggle-label">System sounds</span>
              <span className="settings-toggle-desc">
                UI confirmations, mode transitions, duel results
              </span>
            </div>
            <SettingsToggle
              active={!isMuted}
              onToggle={handleMuteToggle}
            />
          </div>

          {!isMuted && (
            <motion.div
              className="settings-volume-row"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={SPRING.DEFAULT}
            >
              <span className="settings-field__label text-label">VOLUME</span>
              <div className="settings-volume-control">
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={volume}
                  onChange={e => handleVolumeChange(Number(e.target.value))}
                  className="settings-volume-slider"
                  aria-label="Volume"
                />
                <span className="settings-volume-value">
                  {Math.round(volume * 100)}%
                </span>
              </div>
            </motion.div>
          )}

          <Divider subtle className="settings-divider" />

          <div className="settings-toggle-row">
            <div className="settings-toggle-info">
              <span className="settings-toggle-label">Ambient audio</span>
              <span className="settings-toggle-desc">
                Background tone that shifts with APEX/HAVEN mode
              </span>
            </div>
            <SettingsToggle
              active={ambientEnabled}
              onToggle={handleAmbientToggle}
            />
          </div>
        </motion.section>

        {/* ─── Black Box ────────────────────────────────────────────────── */}
        <motion.div variants={CARD_REVEAL_VARIANTS}>
          <BlackBox />
        </motion.div>

        {/* ─── Danger zone ──────────────────────────────────────────────── */}
        <motion.section
          className="settings-section card card--pad-lg"
          variants={CARD_REVEAL_VARIANTS}
        >
          <h2 className="settings-section__title settings-section__title--danger text-label">
            SESSION
          </h2>

          <div className="settings-danger-row">
            <div className="settings-toggle-info">
              <span className="settings-toggle-label">Sign out</span>
              <span className="settings-toggle-desc">
                Clears session. Your data is preserved.
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSignOut}
            >
              SIGN OUT
            </Button>
          </div>
        </motion.section>

      </motion.div>
    </PageWrapper>
  )
}

// ─── Toggle component ─────────────────────────────────────────────────────────

function SettingsToggle({
  active,
  onToggle,
}: {
  active: boolean
  onToggle: () => void
}) {
  return (
    <motion.button
      className={`settings-toggle ${active ? 'settings-toggle--active' : ''}`}
      onClick={onToggle}
      whileTap={{ scale: 0.95 }}
      transition={SPRING.SNAP}
      role="switch"
      aria-checked={active}
    >
      <motion.div
        className="settings-toggle__thumb"
        animate={{ x: active ? 18 : 2 }}
        transition={SPRING.SNAP}
      />
    </motion.button>
  )
}
