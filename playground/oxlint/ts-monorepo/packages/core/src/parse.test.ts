import { describe, expect, it } from 'vitest'
import { parseRecord } from './parse'

describe('parseRecord', () => {
  it('keeps the string fields of an untrusted payload', () => {
    expect(parseRecord({ count: 2, name: 'world' })).toEqual({ name: 'world' })
  })

  it('rejects a payload that is not an object', () => {
    expect(() => parseRecord('world')).toThrow(TypeError)
  })
})
