import { describe, expect, it } from 'vitest'
import { matchesHost } from './url-match'

describe('matchesHost', () => {
  it('matches a declared host and its subdomains', () => {
    expect(matchesHost('https://example.com/page', ['example.com'])).toBe(true)
    expect(matchesHost('https://docs.example.com/page', ['example.com'])).toBe(true)
  })

  it('rejects an undeclared host and a string that is not a URL', () => {
    expect(matchesHost('https://example.org/page', ['example.com'])).toBe(false)
    expect(matchesHost('not a url', ['example.com'])).toBe(false)
  })
})
