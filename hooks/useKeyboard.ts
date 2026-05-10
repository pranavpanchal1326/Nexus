'use client'
import { useEffect, useCallback } from 'react'

// ─── Types ────────────────────────────────────────────────────────────────────

type ModifierKey = 'ctrl' | 'cmd' | 'shift' | 'alt'

interface KeyboardShortcut {
  /** Key — e.g. 'k', 'Enter', 'Escape', 'ArrowUp' */
  key:            string
  /** Optional modifier keys */
  modifiers?:     ModifierKey[]
  /** Handler — called when shortcut fires */
  handler:        (event: KeyboardEvent) => void
  /** Description — for settings display */
  description?:   string
  /**
   * Whether shortcut fires even when an input is focused.
   * Default false — shortcuts suppressed during text input.
   */
  allowInInput?:  boolean
}

// ─── Input detection ──────────────────────────────────────────────────────────

function isInputFocused(): boolean {
  const el  = document.activeElement as HTMLElement | null
  if (!el) return false
  const tag = el.tagName
  return (
    tag === 'INPUT' ||
    tag === 'TEXTAREA' ||
    tag === 'SELECT' ||
    el.isContentEditable
  )
}

// ─── Platform detection ───────────────────────────────────────────────────────

function isMac(): boolean {
  return typeof navigator !== 'undefined' &&
    /Mac|iPod|iPhone|iPad/.test(navigator.platform)
}

// ─── Modifier matching ────────────────────────────────────────────────────────

function modifiersMatch(e: KeyboardEvent, modifiers: ModifierKey[] = []): boolean {
  const needsCmd   = modifiers.includes('cmd')
  const needsCtrl  = modifiers.includes('ctrl')
  const needsShift = modifiers.includes('shift')
  const needsAlt   = modifiers.includes('alt')

  // On Mac, cmd = metaKey. On Windows/Linux, cmd = ctrlKey.
  const cmdOrCtrl = isMac() ? e.metaKey : e.ctrlKey

  if (needsCmd   && !cmdOrCtrl)  return false
  if (needsCtrl  && !e.ctrlKey)  return false
  if (needsShift && !e.shiftKey) return false
  if (needsAlt   && !e.altKey)   return false

  // Prevent false positives — unintended modifiers must not be pressed
  if (!needsCmd   && cmdOrCtrl)  return false
  if (!needsShift && e.shiftKey) return false
  if (!needsAlt   && e.altKey)   return false

  return true
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * Register keyboard shortcuts.
 * Shortcuts do not fire when an input/textarea is focused (unless allowInInput is set).
 * First match wins — no event bubbling.
 * Automatically cleaned up on unmount.
 */
export function useKeyboard(shortcuts: KeyboardShortcut[]): void {
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    for (const shortcut of shortcuts) {
      if (e.key.toLowerCase() !== shortcut.key.toLowerCase()) continue
      if (!modifiersMatch(e, shortcut.modifiers))             continue
      if (!shortcut.allowInInput && isInputFocused())         continue

      e.preventDefault()
      shortcut.handler(e)
      return  // First match wins
    }
  }, [shortcuts]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])
}

// ─── Global NEXUS shortcut definitions ───────────────────────────────────────

export const NEXUS_SHORTCUTS = {
  ORACLE: {
    key:         'k',
    modifiers:   ['cmd'] as ModifierKey[],
    description: '⌘K — Open Oracle',
  },
  JOURNAL: {
    key:         'j',
    modifiers:   ['cmd'] as ModifierKey[],
    description: '⌘J — Open Journal',
  },
  DASHBOARD: {
    key:         'd',
    modifiers:   ['cmd'] as ModifierKey[],
    description: '⌘D — Dashboard',
  },
  TOGGLE_INTEL: {
    key:         'i',
    modifiers:   ['cmd'] as ModifierKey[],
    description: '⌘I — Toggle Intel Panel',
  },
  TOGGLE_MUTE: {
    key:         'm',
    modifiers:   ['cmd'] as ModifierKey[],
    description: '⌘M — Toggle Audio',
  },
} as const
