import { describe, expect, it } from 'vitest'
import { GLOB_SRC } from '../src/globs'
import { coverageReport } from '../src/oxlint/report'
import { eslintObject, oxlintObjectWith, rulesOf } from './helpers/emission'

/** The house rules, in the order Upstream lists them. */
const HOUSE_RULES = [
  'unicorn/consistent-empty-array-spread',
  'unicorn/error-message',
  'unicorn/escape-case',
  'unicorn/new-for-builtins',
  'unicorn/no-instanceof-builtins',
  'unicorn/no-new-array',
  'unicorn/no-new-buffer',
  'unicorn/number-literal-case',
  'unicorn/prefer-dom-node-text-content',
  'unicorn/prefer-includes',
  'unicorn/prefer-node-protocol',
  'unicorn/prefer-number-properties',
  'unicorn/prefer-string-starts-ends-with',
  'unicorn/prefer-type-error',
  'unicorn/throw-new-error',
]

describe('eslint() unicorn module', () => {
  it('declares the plugin on a setup object, so it can be configured separately', async () => {
    const setup = await eslintObject('lumirelle/unicorn/setup')

    expect(Object.keys(setup.plugins ?? {})).toEqual(['unicorn'])
    expect(setup.rules).toBeUndefined()
    expect(setup.files).toBeUndefined()
  })

  it('scopes the house rules to source files', async () => {
    const rules = await eslintObject('lumirelle/unicorn/rules')

    expect(rules.files).toEqual([GLOB_SRC])
    expect(rules.ignores).toBeUndefined()
  })

  it('enables exactly the rules Upstream enables, all as errors', async () => {
    const emitted = rulesOf(await eslintObject('lumirelle/unicorn/rules'))

    expect(Object.keys(emitted)).toEqual(HOUSE_RULES)
    expect(Object.values(emitted).every(severity => severity === 'error')).toBe(true)
  })
})

describe('oxlint() unicorn module', () => {
  it('emits the same rules through the built-in unicorn scope', async () => {
    const emitted = rulesOf(await oxlintObjectWith('unicorn/error-message'))

    expect(Object.keys(emitted).sort()).toEqual([...HOUSE_RULES].sort())
  })

  it('leaves nothing to the Coverage report: Oxlint implements every rule of the module', () => {
    expect(coverageReport().modules.unicorn).toBeUndefined()
  })
})
