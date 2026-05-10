'use client'
import { useCallback, useEffect, useRef } from 'react'
import { useNexusStore } from '@/store/nexusStore'
import {
  playSound,
  startAmbient,
  stopAmbient,
  setVolume,
  mute,
  unmute,
  setAmbientEnabled,
  initAudio,
  loadAudioPreferences,
  persistAudioPreferences,
  getAudioState,
  type SoundId,
} from '@/lib/audio'

export function useAudio() {
  const mode        = useNexusStore(state => state.mode)
  const hasInitRef  = useRef(false)

  // Load preferences on mount
  useEffect(() => {
    loadAudioPreferences()
  }, [])

  // Switch ambient when mode changes
  useEffect(() => {
    const { ambientActive } = getAudioState()
    if (ambientActive) startAmbient(mode)
  }, [mode])

  // Initialize audio on first interaction — required by browser autoplay policy
  const handleFirstInteraction = useCallback(() => {
    if (hasInitRef.current) return
    hasInitRef.current = true
    initAudio()
  }, [])

  useEffect(() => {
    window.addEventListener('click',     handleFirstInteraction, { once: true })
    window.addEventListener('keydown',   handleFirstInteraction, { once: true })
    window.addEventListener('touchstart', handleFirstInteraction, { once: true })
    return () => {
      window.removeEventListener('click',     handleFirstInteraction)
      window.removeEventListener('keydown',   handleFirstInteraction)
      window.removeEventListener('touchstart', handleFirstInteraction)
    }
  }, [handleFirstInteraction])

  const play = useCallback((id: SoundId) => {
    playSound(id)
  }, [])

  const toggleMute = useCallback(() => {
    const { muted } = getAudioState()
    if (muted) unmute()
    else        mute()
    persistAudioPreferences()
  }, [])

  const changeVolume = useCallback((vol: number) => {
    setVolume(vol)
    persistAudioPreferences()
  }, [])

  const toggleAmbient = useCallback(() => {
    const { ambientActive } = getAudioState()
    setAmbientEnabled(!ambientActive, mode)
    persistAudioPreferences()
  }, [mode])

  return {
    play,
    toggleMute,
    changeVolume,
    toggleAmbient,
    stopAmbient,
    getAudioState,
  }
}

/**
 * Convenience hook — play sound on component events.
 * Usage: const { playNav } = useAudioEvents()
 */
export function useAudioEvents() {
  const { play } = useAudio()

  return {
    playNav:       () => play('nav-tap'),
    playButton:    () => play('button-press'),
    playModalOpen: () => play('modal-open'),
    playModalClose:() => play('modal-close'),
    playJournalSave: () => play('journal-save'),
    playGymLog:    () => play('gym-log'),
    playDuelStart: () => play('duel-start'),
    playDuelWin:   () => play('duel-win'),
    playDuelLose:  () => play('duel-lose'),
    playOracleStart: () => play('oracle-start'),
    playWordAppear:  () => play('word-appear'),
    playMilestone:   () => play('streak-milestone'),
  }
}
