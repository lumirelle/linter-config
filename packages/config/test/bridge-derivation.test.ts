import { describe, expect, it, vi } from 'vitest'
import { houseOptions } from './helpers/emission'

/**
 * `vi.mock` is file-scoped, so this counting wrapper lives in its own file: the one thing it
 * asserts is how often the factory touches Source, not what the Emission contains.
 */
const counts = vi.hoisted(() => ({ source: 0 }))

vi.mock('../src/source', async importOriginal => {
  const actual = await importOriginal<typeof import('../src/source')>()
  return {
    ...actual,
    source: (...args: Parameters<typeof actual.source>) => {
      counts.source += 1
      return actual.source(...args)
    },
  }
})

const { eslint } = await import('../src/eslint')

describe('one factory call', () => {
  it('builds Source once when `oxlint` asks for the Bridge', async () => {
    counts.source = 0
    await eslint(houseOptions({ oxlint: true }))

    // Both Emissions come from the same Config objects, so the Bridge costs no second Source build.
    expect(counts.source).toBe(1)
  })

  it('builds Source once without `oxlint` as well', async () => {
    counts.source = 0
    await eslint(houseOptions())

    expect(counts.source).toBe(1)
  })
})
