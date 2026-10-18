import { describe, expect, it } from 'vitest'
import { configNames, loadExample, objectsOfModule } from './helpers/emission'

describe('the `ts` example', () => {
  it('emits the Config objects a TypeScript library with the test Module asks for', async () => {
    const { eslint } = await loadExample('ts')
    const names = configNames(eslint)

    // `typescript.tsconfigPath` brings the type-aware parser and rule block, on both sides.
    expect(names).toContain('lumirelle/typescript/type-aware-parser')
    expect(names).toContain('lumirelle/typescript/rules-type-aware')
    // The example's own options module turns the test Module on.
    expect(names).toContain('lumirelle/test/rules')
  })

  it('turns on Oxlint\'s type-aware mode through that same options module', async () => {
    const { oxlint } = await loadExample('ts')

    // Loading the second Emission is the other half of the test: a missing peer, parser or
    // processor throws here, not in a consumer's repository.
    expect(oxlint.options).toEqual({ typeAware: true })
  })

  it('does not emit the framework Modules the example leaves off', async () => {
    const { eslint } = await loadExample('ts')

    for (const module of ['vue', 'react', 'nextjs'] as const) {
      expect(objectsOfModule(eslint, module)).toEqual([])
    }
  })
})
