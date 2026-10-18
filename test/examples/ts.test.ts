import { describe, expect, it } from 'vitest'
import { configNames, expectNoModules, loadExample } from './helpers/emission'

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

    expect(oxlint.options).toEqual({ typeAware: true })
  })

  it('does not emit the framework Modules the example leaves off', async () => {
    const { eslint } = await loadExample('ts')

    expectNoModules(eslint, ['vue', 'react', 'nextjs'])
  })
})
