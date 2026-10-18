import { describe, expect, it } from 'vitest'
import { GLOB_SRC } from '../src/globs'
import { coverageReport } from '../src/oxlint/report'
import { eslintObject, oxlintObjectWith, rulesOf } from './helpers/emission'

/** The rules Upstream enables whether or not stylistic is on. */
const HOUSE_RULES = [
  'jsdoc/check-access',
  'jsdoc/check-param-names',
  'jsdoc/check-property-names',
  'jsdoc/check-types',
  'jsdoc/empty-tags',
  'jsdoc/implements-on-classes',
  'jsdoc/no-defaults',
  'jsdoc/no-multi-asterisks',
  'jsdoc/require-param-name',
  'jsdoc/require-property',
  'jsdoc/require-property-description',
  'jsdoc/require-property-name',
  'jsdoc/require-returns-check',
  'jsdoc/require-returns-description',
  'jsdoc/require-yields-check',
]

describe('eslint() jsdoc module', () => {
  it('declares the plugin on a setup object', async () => {
    const setup = await eslintObject('lumirelle/jsdoc/setup')

    expect(Object.keys(setup.plugins ?? {})).toEqual(['jsdoc'])
    expect(setup.rules).toBeUndefined()
  })

  it('scopes the rules to source files and warns, as Upstream does', async () => {
    const rules = await eslintObject('lumirelle/jsdoc/rules')

    expect(rules.files).toEqual([GLOB_SRC])
    expect(Object.keys(rulesOf(rules))).toEqual(HOUSE_RULES)
    expect(Object.values(rulesOf(rules)).every(severity => severity === 'warn')).toBe(true)
  })

  it('adds the two stylistic rules only when the caller turns stylistic on', async () => {
    const off = rulesOf(await eslintObject('lumirelle/jsdoc/rules'))
    const on = rulesOf(await eslintObject('lumirelle/jsdoc/rules', { stylistic: true }))

    expect(off['jsdoc/check-alignment']).toBeUndefined()
    expect(on['jsdoc/check-alignment']).toBe('warn')
    expect(on['jsdoc/multiline-blocks']).toBe('warn')
  })
})

describe('oxlint() jsdoc module', () => {
  it('maps what Oxlint implements onto the built-in jsdoc scope, keeping the warnings', async () => {
    const emitted = rulesOf(await oxlintObjectWith('jsdoc/check-access'))

    expect(emitted['jsdoc/check-access']).toBe('warn')
    expect(emitted['jsdoc/empty-tags']).toBe('warn')
    expect(emitted['jsdoc/require-param-name']).toBe('warn')
  })

  it('records every rule the built-in jsdoc scope does not carry, in Source order', () => {
    expect(coverageReport().modules.jsdoc).toEqual([
      { key: 'jsdoc/check-alignment', reason: 'unknown-rule' },
      { key: 'jsdoc/check-param-names', reason: 'unknown-rule' },
      { key: 'jsdoc/check-types', reason: 'unknown-rule' },
      { key: 'jsdoc/multiline-blocks', reason: 'unknown-rule' },
      { key: 'jsdoc/no-multi-asterisks', reason: 'unknown-rule' },
      { key: 'jsdoc/require-returns-check', reason: 'unknown-rule' },
      { key: 'jsdoc/require-yields-check', reason: 'unknown-rule' },
    ])
  })
})
