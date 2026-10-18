import { describe, expect, it } from 'vitest'
import { eslint } from '../src/eslint'
import { GLOB_TESTS } from '../src/globs'
import { coverageReport } from '../src/oxlint/report'
import { eslintObject, houseOptions, oxlintObjectWith, rulesOf } from './helpers/emission'

describe('eslint() test module', () => {
  it('declares the composed test plugin on a setup object', async () => {
    const setup = await eslintObject('lumirelle/test/setup')

    expect(Object.keys(setup.plugins ?? {})).toEqual(['test'])
    expect(setup.rules).toBeUndefined()
  })

  it('scopes the rules to the test globs', async () => {
    expect((await eslintObject('lumirelle/test/rules')).files).toEqual(GLOB_TESTS)
  })

  it('enables the vitest rules Upstream enables, with their options', async () => {
    const emitted = rulesOf(await eslintObject('lumirelle/test/rules'))

    expect(emitted['test/consistent-test-it']).toEqual(['error', { fn: 'it', withinDescribe: 'it' }])
    expect(emitted['test/no-identical-title']).toBe('error')
    expect(emitted['test/no-import-node-test']).toBe('error')
    expect(emitted['test/prefer-hooks-in-order']).toBe('error')
    expect(emitted['test/prefer-lowercase-title']).toBe('error')
  })

  it('downgrades no-only-tests inside an editor, as the other autofixable rules are', async () => {
    expect(rulesOf(await eslintObject('lumirelle/test/rules'))['test/no-only-tests']).toBe('error')
    expect(rulesOf(await eslintObject('lumirelle/test/rules', { isInEditor: true }))['test/no-only-tests']).toBe('warn')
  })

  it('turns off the rules the other Modules enabled inside test files', async () => {
    const emitted = rulesOf(await eslintObject('lumirelle/test/rules'))

    expect(emitted['antfu/no-top-level-await']).toBe('off')
    expect(emitted['no-unused-expressions']).toBe('off')
    expect(emitted['node/prefer-global/process']).toBe('off')
  })

  it('leaves out an entry for a rule no Module of this Source enables', async () => {
    const emitted = rulesOf(await eslintObject('lumirelle/test/rules'))

    // `e18e/prefer-static-regex` is Upstream's, but the e18e Module is not ported yet; a rule
    // nothing enables must not turn up as an `off` entry, or Oxlint would need a plugin for it.
    expect(emitted['e18e/prefer-static-regex']).toBeUndefined()
    // `ts/explicit-function-return-type` exists only for libraries.
    expect(emitted['ts/explicit-function-return-type']).toBeUndefined()
    expect(rulesOf(await eslintObject('lumirelle/test/rules', { type: 'lib' }))['ts/explicit-function-return-type'])
      .toBe('off')
  })

  it('drops the entry of a Module the caller turned off', async () => {
    expect(rulesOf(await eslintObject('lumirelle/test/rules', { node: false }))['node/prefer-global/process'])
      .toBeUndefined()
  })

  it('turns the module off with test: false', async () => {
    const names = (await eslint(houseOptions({ test: false }))).map(config => config.name)

    expect(names.some(name => name?.startsWith('lumirelle/test/'))).toBe(false)
  })

  it('takes rule overrides from the option object, as Upstream\'s option shape allows', async () => {
    const emitted = rulesOf(await eslintObject('lumirelle/test/rules', {
      test: { overrides: { 'test/no-identical-title': 'off' } },
    }))

    expect(emitted['test/no-identical-title']).toBe('off')
  })
})

describe('oxlint() test module', () => {
  it('maps the test rules onto the built-in vitest scope', async () => {
    const emitted = rulesOf(await oxlintObjectWith('vitest/consistent-test-it'))

    expect(emitted['vitest/consistent-test-it']).toEqual(['error', { fn: 'it', withinDescribe: 'it' }])
    expect(emitted['vitest/prefer-hooks-in-order']).toBe('error')
    expect(emitted['vitest/prefer-lowercase-title']).toBe('error')
  })

  it('records the rules Oxlint does not carry, and the one it spells differently', () => {
    expect(coverageReport().modules.test).toEqual(expect.arrayContaining([
      { key: 'test/no-only-tests', oxlint: 'vitest/no-focused-tests', reason: 'renamed-rule' },
      { key: 'node/prefer-global/process', reason: 'unknown-rule' },
    ]))
  })
})
