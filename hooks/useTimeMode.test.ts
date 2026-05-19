import { describe, it, expect } from 'vitest'
import {
  calculateCircadianState,
  formatMinutesAsTime,
  resolveMode,
} from '../hooks/useTimeMode'

describe('calculateCircadianState', () => {
  const makeDate = (h: number, m = 0) => {
    const d = new Date()
    d.setHours(h, m, 0, 0)
    return d
  }

  it('returns apex for 05:00 exactly', () => {
    expect(calculateCircadianState(makeDate(5)).mode).toBe('apex')
  })

  it('returns apex for 09:30', () => {
    expect(calculateCircadianState(makeDate(9, 30)).mode).toBe('apex')
  })

  it('returns apex for 12:59', () => {
    expect(calculateCircadianState(makeDate(12, 59)).mode).toBe('apex')
  })

  it('returns haven for 13:00 — boundary', () => {
    expect(calculateCircadianState(makeDate(13)).mode).toBe('haven')
  })

  it('returns haven for 20:00', () => {
    expect(calculateCircadianState(makeDate(20)).mode).toBe('haven')
  })

  it('returns haven for 00:00 midnight', () => {
    expect(calculateCircadianState(makeDate(0)).mode).toBe('haven')
  })

  it('returns haven for 04:59', () => {
    expect(calculateCircadianState(makeDate(4, 59)).mode).toBe('haven')
  })

  it('minutesRemaining correct for apex at 09:00', () => {
    const { minutesRemaining } = calculateCircadianState(makeDate(9))
    expect(minutesRemaining).toBe(240)
  })

  it('minutesRemaining correct for haven at 14:00', () => {
    const { minutesRemaining } = calculateCircadianState(makeDate(14))
    expect(minutesRemaining).toBe(900)
  })

  it('windowEnd hours correct for apex', () => {
    const { windowEnd } = calculateCircadianState(makeDate(9))
    expect(windowEnd.getHours()).toBe(13)
    expect(windowEnd.getMinutes()).toBe(0)
  })
})

describe('formatMinutesAsTime', () => {
  it('formats 0 as 00:00', () => expect(formatMinutesAsTime(0)).toBe('00:00'))
  it('formats 60 as 01:00', () => expect(formatMinutesAsTime(60)).toBe('01:00'))
  it('formats 90 as 01:30', () => expect(formatMinutesAsTime(90)).toBe('01:30'))
  it('formats 273 as 04:33', () => expect(formatMinutesAsTime(273)).toBe('04:33'))
  it('formats 900 as 15:00', () => expect(formatMinutesAsTime(900)).toBe('15:00'))
  it('pads single digit minutes', () => expect(formatMinutesAsTime(61)).toBe('01:01'))
})

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

  it('matching preferred mode — isOverridden false', () => {
    const { resolved, isOverridden } = resolveMode('apex', 'apex')
    expect(resolved).toBe('apex')
    expect(isOverridden).toBe(false)
  })
})
