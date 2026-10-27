import type { Example } from '../../playground/examples'
import { describe, expect, it } from 'vitest'
import { resolveStack } from '../../playground/examples'
import { configNames, expectNoModules, loadExample } from './helpers/emission'

/**
 * The scope the example's `overrides` entry narrows the type-aware rule block to, and the one rule
 * it turns off there. Written down rather than read back from the options module, so an entry that
 * lost its scope cannot agree with its own assertion.
 */
const NARROWED_PACKAGE = 'packages/core/**/*.ts'

/** The stack's three examples, one per flavor, resolved the way the runner resolves them. */
const EXAMPLES = await resolveStack('ts-monorepo')

describe('the `eslint-oxlint/ts-monorepo` example', () => {
  it('emits the Config objects a TypeScript library with the test Module asks for', async () => {
    const { eslint } = await loadExample('eslint-oxlint/ts-monorepo')
    const names = configNames(eslint)

    // One options object for the whole workspace: `typescript.tsconfigPath` brings the type-aware
    // parser and rule block, on both sides, exactly as it does for a single-package library.
    expect(names).toContain('lumirelle/typescript/type-aware-parser')
    expect(names).toContain('lumirelle/typescript/rules-type-aware')
    expect(names).toContain('lumirelle/test/rules')
  })

  it('turns on Oxlint\'s type-aware mode through that same options module', async () => {
    const { oxlint } = await loadExample('eslint-oxlint/ts-monorepo')

    expect(oxlint.options).toEqual({ typeAware: true })
  })

  it('does not emit the framework Modules the example leaves off', async () => {
    const { eslint } = await loadExample('eslint-oxlint/ts-monorepo')

    expectNoModules(eslint, ['vue', 'react', 'nextjs'])
  })
})

describe('the `ts-monorepo` per-package override', () => {
  it('is asserted on all three flavors, not on the paired one alone', () => {
    // An `overrides` entry belongs to the stack's options, so every flavor has to carry it; a stack
    // that lost a flavor directory would otherwise assert the paired one and call it every flavor.
    expect(EXAMPLES.map(example => example.name)).toEqual([
      'eslint/ts-monorepo',
      'oxlint/ts-monorepo',
      'eslint-oxlint/ts-monorepo',
    ])
  })

  describe.each(EXAMPLES)('$name', (example: Example) => {
    it.skipIf(!example.eslint)('narrows one package\'s type-aware rules in the ESLint Emission', () => {
      const rules = example.eslint?.find(config => config.name === 'lumirelle/typescript/rules-type-aware')

      // An `overrides` entry keyed by Config object name rescopes exactly that object: `files`
      // replaces its scope, so the package named here is the one the type-aware rules now cover.
      expect(rules?.files).toEqual([NARROWED_PACKAGE])
      // The rule change lands on the same object, and the rest of the type-aware set stays on.
      expect(rules?.rules?.['ts/no-unsafe-assignment']).toBe('off')
      expect(rules?.rules?.['ts/no-floating-promises']).toBe('error')
    })

    it.skipIf(!example.oxlint)('narrows the same package in the Oxlint Emission', () => {
      // One entry in the options module reaches both Emissions, so the two tools agree on the
      // package scope; Oxlint spells the same rule under its built-in `typescript` scope.
      const narrowed = (example.oxlint?.overrides ?? []).filter(override => (override.files ?? []).includes(NARROWED_PACKAGE))

      expect(narrowed).toHaveLength(1)
      expect(narrowed[0]?.rules?.['typescript/no-unsafe-assignment']).toBe('off')
    })
  })
})
