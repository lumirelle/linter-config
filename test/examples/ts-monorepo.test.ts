import { describe, expect, it } from 'vitest'
import { configNames, loadExample, objectsOfModule } from './helpers/emission'

describe('the `ts-monorepo` example', () => {
  it('emits the Config objects a TypeScript library with the test Module asks for', async () => {
    const { eslint } = await loadExample('ts-monorepo')
    const names = configNames(eslint)

    // One options object for the whole workspace: `typescript.tsconfigPath` brings the type-aware
    // parser and rule block, on both sides, exactly as it does for a single-package library.
    expect(names).toContain('lumirelle/typescript/type-aware-parser')
    expect(names).toContain('lumirelle/typescript/rules-type-aware')
    expect(names).toContain('lumirelle/test/rules')
  })

  it('narrows one package\'s type-aware rules through the same options module', async () => {
    const { eslint, oxlint } = await loadExample('ts-monorepo')
    const rules = eslint.find(config => config.name === 'lumirelle/typescript/rules-type-aware')

    // An `overrides` entry keyed by Config object name rescopes exactly that object: `files`
    // replaces its scope, so the package named here is the one the type-aware rules now cover.
    expect(rules?.files).toEqual(['packages/core/**'])
    // The rule change lands on the same object, and the rest of the type-aware set stays on.
    expect(rules?.rules?.['ts/no-unsafe-assignment']).toBe('off')
    expect(rules?.rules?.['ts/no-floating-promises']).toBe('error')

    // One entry in the options module reaches both Emissions, so the two tools agree on the
    // package scope; Oxlint spells the same rule under its built-in `typescript` scope.
    const narrowed = (oxlint.overrides ?? []).filter(override => (override.files ?? []).includes('packages/core/**'))
    expect(narrowed).toHaveLength(1)
    expect(narrowed[0]?.rules?.['typescript/no-unsafe-assignment']).toBe('off')
  })

  it('turns on Oxlint\'s type-aware mode through that same options module', async () => {
    const { oxlint } = await loadExample('ts-monorepo')

    // Loading the second Emission is the other half of the test: a missing peer, parser or
    // processor throws here, not in a consumer's repository.
    expect(oxlint.options).toEqual({ typeAware: true })
  })

  it('does not emit the framework Modules the example leaves off', async () => {
    const { eslint } = await loadExample('ts-monorepo')

    for (const module of ['vue', 'react', 'nextjs'] as const) {
      expect(objectsOfModule(eslint, module)).toEqual([])
    }
  })
})
