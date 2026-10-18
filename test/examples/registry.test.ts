import { describe, expect, it } from 'vitest'
import { listExamples, resolveExample } from '../../playground/examples'

describe('the example registry', () => {
  it('lists the examples the playground holds', async () => {
    expect(await listExamples()).toContain('ts')
  })

  it('fails an unknown name and names the valid ones', async () => {
    await expect(resolveExample('nope')).rejects.toThrow(/Unknown example "nope"\. Valid examples: ts/)
  })
})
