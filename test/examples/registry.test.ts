import { describe, expect, it } from 'vitest'
import { listExamples, resolveExample } from '../../playground/examples'

/** Every example the playground ships, in the sorted order the registry returns. */
const EXAMPLE_NAMES = ['next', 'nuxt', 'react', 'ts', 'ts-monorepo', 'vue', 'webext']

describe('the example registry', () => {
  it('lists exactly the examples the playground ships, sorted', async () => {
    expect(await listExamples()).toEqual(EXAMPLE_NAMES)
  })

  it('fails an unknown name and names the valid ones', async () => {
    const failure = await resolveExample('nope').then(() => undefined, (error: Error) => error)

    expect(failure?.message).toBe(`Unknown example "nope". Valid examples: ${EXAMPLE_NAMES.join(', ')}`)
  })
})
