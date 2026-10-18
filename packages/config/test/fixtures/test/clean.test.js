import { describe, expect, it } from 'vitest'

describe('greeting', () => {
  it('greets a name', () => {
    expect(`hello, ${'name'}`).toBe('hello, name')
  })
})
