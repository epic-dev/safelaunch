import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { getRelativeTime } from '../src/utils/getRelativeTime'

describe('getRelativeTime', () => {
  const NOW = new Date('2026-01-15T12:00:00.000Z')

  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(NOW)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('returns "just now" for a timestamp less than a minute ago', () => {
    const thirtySecondsAgo = new Date(NOW.getTime() - 30_000).toISOString()
    expect(getRelativeTime(thirtySecondsAgo)).toBe('just now')
  })

  it('returns "just now" for a timestamp exactly now', () => {
    expect(getRelativeTime(NOW.toISOString())).toBe('just now')
  })

  it('returns minutes ago for a timestamp under an hour old', () => {
    const fiveMinutesAgo = new Date(NOW.getTime() - 5 * 60_000).toISOString()
    expect(getRelativeTime(fiveMinutesAgo)).toBe('5m ago')
  })

  it('returns hours ago for a timestamp under a day old', () => {
    const threeHoursAgo = new Date(NOW.getTime() - 3 * 60 * 60_000).toISOString()
    expect(getRelativeTime(threeHoursAgo)).toBe('3h ago')
  })

  it('returns days ago for a timestamp a day or more old', () => {
    const twoDaysAgo = new Date(NOW.getTime() - 2 * 24 * 60 * 60_000).toISOString()
    expect(getRelativeTime(twoDaysAgo)).toBe('2d ago')
  })

  it('returns "Invalid date" for an unparseable string', () => {
    expect(getRelativeTime('not-a-date')).toBe('Invalid date')
  })

  it('returns "just now" for a timestamp in the future', () => {
    const oneMinuteFromNow = new Date(NOW.getTime() + 60_000).toISOString()
    expect(getRelativeTime(oneMinuteFromNow)).toBe('just now')
  })
})
