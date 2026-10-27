import type { Linter } from 'eslint'
import { describe, expect, it } from 'vitest'
import { resolveExample } from '../../playground/examples'
import { configNames, expectNoModules, loadExample, objectsOfModule } from './helpers/emission'

/**
 * The React Config objects of an ESLint Emission, compared the way two Emissions are compared.
 *
 * A whole-object comparison cannot be the assertion: a processor is rebuilt per call, so two
 * Emissions built from the same options are never identity-equal. Names, file scopes and rules are
 * what a Module or a flavor can change; plugins and processors belong to the Modules.
 */
function reactObjects(configs: readonly Linter.Config[]): Array<Pick<Linter.Config, 'name' | 'files' | 'ignores' | 'rules'>> {
  return configs
    .filter(config => config.name?.startsWith('lumirelle/react/'))
    .map(config => ({ name: config.name, files: config.files, ignores: config.ignores, rules: config.rules }))
}

describe('the `eslint-oxlint/next` example', () => {
  it('emits the React Config objects its options module shares with the `react` example', async () => {
    const { eslint } = await loadExample('eslint-oxlint/next')
    const names = configNames(eslint)

    // The point of the pair: `react: true` emits the same three objects here as in `react`, and the
    // Next Module only adds to them.
    expect(names).toContain('lumirelle/react/setup')
    expect(names).toContain('lumirelle/react/rules')
    expect(names).toContain('lumirelle/react/typescript')
  })

  it('emits the Next Config objects and the test Module', async () => {
    const { eslint } = await loadExample('eslint-oxlint/next')
    const names = configNames(eslint)

    expect(names).toContain('lumirelle/nextjs/setup')
    expect(names).toContain('lumirelle/nextjs/rules')
    expect(names).toContain('lumirelle/test/rules')
  })

  it('does not emit the JSX, UnoCSS or Vue Config objects', async () => {
    const { eslint } = await loadExample('eslint-oxlint/next')

    // `jsx` is off here on purpose: the React and Next Modules already declare the JSX parser flag
    // for their own files, so the difference between the two examples stays visible.
    expectNoModules(eslint, ['jsx', 'unocss', 'vue'])
  })

  it('loads the Oxlint Emission of the same options module', async () => {
    const { oxlint } = await loadExample('eslint-oxlint/next')

    expect(oxlint).toBeTypeOf('object')
  })
})

describe('the `next` stack\'s React pair relation', () => {
  it.each(['eslint/next', 'eslint-oxlint/next'])(
    'emits the React Config objects of the `react` stack, unchanged, in %s',
    async (name) => {
      // The pair relation is a relation between two stacks, so it is compared through the registry:
      // the React Module is one Module, and the Next Module may only add to what it emits. Both
      // ESLint-carrying flavors are checked, because a flavor is what could drift.
      const [next, react] = await Promise.all([resolveExample(name), resolveExample('eslint-oxlint/react')])
      const emission = next.eslint!

      expect(reactObjects(emission)).toEqual(reactObjects(react.eslint!))
      expect(objectsOfModule(emission, 'nextjs')).toEqual(['lumirelle/nextjs/setup', 'lumirelle/nextjs/rules'])

      // "Only adds": every Next object comes after the React block the equality above found intact,
      // so the Next Module contributes objects rather than rewriting them.
      const names = configNames(emission)
      expect(names.indexOf('lumirelle/nextjs/setup')).toBeGreaterThan(names.indexOf('lumirelle/react/typescript'))
    },
  )
})
