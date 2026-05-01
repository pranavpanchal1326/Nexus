import { describe, it, expect } from 'vitest'
import {
  calculateCircadianState,
  formatMinutesAsTime,
  resolveMode,
} from './useTimeMode'

// ─── calculateCircadianState ──────────────────────────────────────────────────

describe('calculateCircadianState', () => {
  it('returns apex for 05:00 exactly', () => {
    const date = new Date()
    date.setHours(5, 0, 0, 0)
    const { mode } = calculateCircadianState(date)
    expect(mode).toBe('apex')
  })

  it('returns apex for 09:30', () => {
    const date = new Date()
    date.setHours(9, 30, 0, 0)
    const { mode } = calculateCircadianState(date)
    expect(mode).toBe('apex')
  })

  it('returns apex for 12:59', () => {
    const date = new Date()
    date.setHours(12, 59, 0, 0)
    const { mode } = calculateCircadianState(date)
    expect(mode).toBe('apex')
  })

  it('returns haven for 13:00 exactly — boundary', () => {
    const date = new Date()
    date.setHours(13, 0, 0, 0)
    const { mode } = calculateCircadianState(date)
    expect(mode).toBe('haven')
  })

  it('returns haven for 20:00', () => {
    const date = new Date()
    date.setHours(20, 0, 0, 0)
    const { mode } = calculateCircadianState(date)
    expect(mode).toBe('haven')
  })

  it('returns haven for 00:00 midnight', () => {
    const date = new Date()
    date.setHours(0, 0, 0, 0)
    const { mode } = calculateCircadianState(date)
    expect(mode).toBe('haven')
  })

  it('returns haven for 04:59', () => {
    const date = new Date()
    date.setHours(4, 59, 0, 0)
    const { mode } = calculateCircadianState(date)
    expect(mode).toBe('haven')
  })

  it('calculates correct minutesRemaining for apex at 09:00', () => {
    const date = new Date()
    date.setHours(9, 0, 0, 0)
    const { minutesRemaining } = calculateCircadianState(date)
    expect(minutesRemaining).toBe(240) // 4 hours to 13:00
  })

  it('calculates correct minutesRemaining for haven at 14:00', () => {
    const date = new Date()
    date.setHours(14, 0, 0, 0)
    const { minutesRemaining } = calculateCircadianState(date)
    expect(minutesRemaining).toBe(900) // 15 hours to 05:00 next day
  })

  it('windowEnd is correct for apex window', () => {
    const date = new Date()
    date.setHours(9, 0, 0, 0)
    const { windowEnd } = calculateCircadianState(date)
    expect(windowEnd.getHours()).toBe(13)
    expect(windowEnd.getMinutes()).toBe(0)
  })
})

// ─── formatMinutesAsTime ──────────────────────────────────────────────────────

describe('formatMinutesAsTime', () => {
  it('formats 0 as 00:00', () => {
    expect(formatMinutesAsTime(0)).toBe('00:00')
  })

  it('formats 60 as 01:00', () => {
    expect(formatMinutesAsTime(60)).toBe('01:00')
  })

  it('formats 90 as 01:30', () => {
    expect(formatMinutesAsTime(90)).toBe('01:30')
  })

  it('formats 273 as 04:33', () => {
    expect(formatMinutesAsTime(273)).toBe('04:33')
  })

  it('formats 900 as 15:00', () => {
    expect(formatMinutesAsTime(900)).toBe('15:00')
  })

  it('pads single digit minutes correctly', () => {
    expect(formatMinutesAsTime(61)).toBe('01:01')
  })
})

// ─── resolveMode ─────────────────────────────────────────────────────────────

describe('resolveMode', () => {
  it('auto defers to circadian', () => {
    const { resolved, isOverridden } = resolveMode('apex', 'auto')
    expect(resolved).toBe('apex')
    expect(isOverridden).toBe(false)
  })

  it('preferred apex overrides haven circadian', () => {
    const { resolved, isOverridden } = resolveMode('haven', 'apex')
    expect(resolved).toBe('apex')
    expect(isOverridden).toBe(true)
  })

  it('preferred haven overrides apex circadian', () => {
    const { resolved, isOverridden } = resolveMode('apex', 'haven')
    expect(resolved).toBe('haven')
    expect(isOverridden).toBe(true)
  })

  it('preferred matching circadian — isOverridden false', () => {
    const { resolved, isOverridden } = resolveMode('apex', 'apex')
    expect(resolved).toBe('apex')
    expect(isOverridden).toBe(false)
  })
})
