import { describe, expect, it } from 'vitest'
import { buildRoomUrl, generatePin, isValidPin } from './relayConfig'

describe('relayConfig', () => {
  it('generates a 6-digit pin', () => {
    for (let i = 0; i < 20; i++) {
      const pin = generatePin()
      expect(pin).toMatch(/^[0-9]{6}$/)
      expect(isValidPin(pin)).toBe(true)
    }
  })

  it('rejects malformed pins', () => {
    expect(isValidPin('12345')).toBe(false)
    expect(isValidPin('1234567')).toBe(false)
    expect(isValidPin('abcdef')).toBe(false)
  })

  it('builds a role-tagged room URL', () => {
    const url = buildRoomUrl('123456', 'tablet')
    expect(url).toMatch(/\/room\/123456\?role=tablet$/)
    expect(buildRoomUrl('123456', 'watch')).toMatch(/role=watch$/)
  })
})
