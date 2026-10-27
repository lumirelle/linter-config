import type { Linter } from 'eslint'
import { describe, expect, it } from 'vitest'
import { resolveExample } from '../../playground/examples'
import { comparableEmission, configNames, expectNoModules, loadExample, objectsOfModule } from './helpers/emission'

/**
 * The React Config objects of an ESLint Emission, compared the way two Emissions are compared.
 *
 * The pair relation is about one Module, so this filters `comparableEmission`'s output rather than
 * rebuilding the projection: a field that comparison starts reading applies here too.
 */
function reactObjects(configs: readonly Linter.Config[]): ReturnType<typeof comparableEmission> {
  return comparableEmission(configs).filter(config => config.name?.startsWith('lumirelle/react/'))
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
