import { describe, expect, it } from 'vitest'
import { listExamples, resolveExample } from '../../playground/examples'

describe('the example registry', () => {
  it('lists the examples the playground holds', async () => {
    expect(await listExamples()).toContain('ts')
  })

  it('fails an unknown name and names the valid ones', async () => {
    const failure = await resolveExample('nope').then(() => undefined, (error: Error) => error)

    expect(failure?.message).toMatch(/^Unknown example "nope"\. Valid examples: /)
    // The list is every example the directory holds, so a later example needs no edit here.
    for (const name of await listExamples()) {
      expect(failure?.message).toContain(name)
    }
  })
})
