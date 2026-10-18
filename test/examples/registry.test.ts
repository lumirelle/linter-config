import { describe, expect, it } from 'vitest'
import { listExamples, resolveExample } from '../../playground/examples'

describe('the example registry', () => {
  it('lists the examples the playground holds', async () => {
    expect(await listExamples()).toContain('ts')
  })

  it('fails an unknown name and names the valid ones', async () => {
    // The names come from the registry rather than a literal, so adding an example does not need
    // this test edited: the message must list exactly what `listExamples()` returns.
    const names = (await listExamples()).join(', ')
    await expect(resolveExample('nope')).rejects.toThrow(new RegExp(`Unknown example "nope"\\. Valid examples: ${names}`))
  })
})
