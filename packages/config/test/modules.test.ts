import { describe, expect, it } from 'vitest'
import { eslint } from '../src/eslint'
import { oxlint } from '../src/oxlint'
import { eslintObject, houseOptions, rulesOf } from './helpers/emission'

/** The option that gates each Module, and the first Config object it emits. */
const MODULES = [
  { name: 'imports', object: 'lumirelle/imports/rules' },
  { name: 'unicorn', object: 'lumirelle/unicorn/setup' },
  { name: 'node', object: 'lumirelle/node/setup' },
  { name: 'jsdoc', object: 'lumirelle/jsdoc/setup' },
  { name: 'test', object: 'lumirelle/test/setup' },
] as const

describe('the options that gate the new Modules', () => {
  it.each(MODULES)('turns $name off with the flag set to false', async ({ name, object }) => {
    const names = (await eslint(houseOptions({ [name]: false }))).map(config => config.name)

    expect(names).not.toContain(object)
  })

  it('leaves the rules of a Module out of the Oxlint Emission too', async () => {
    const config = await oxlint(houseOptions({ test: false, unicorn: false }))
    const rules = (config.overrides ?? []).flatMap(override => Object.keys(override.rules ?? {}))

    expect(rules.some(rule => rule.startsWith('vitest/'))).toBe(false)
    expect(rules.some(rule => rule.startsWith('unicorn/'))).toBe(false)
  })

  it('takes a per-Module rule override by Module id', async () => {
    const rules = rulesOf(await eslintObject('lumirelle/imports/rules', {
      overrides: { imports: { rules: { 'import/first': 'off' } } },
    }))

    expect(rules['import/first']).toBe('off')
    expect(rules['import/no-duplicates']).toBe('error')
  })

  it('takes a rule override aimed at one Config object by its name', async () => {
    const rules = rulesOf(await eslintObject('lumirelle/node/rules', {
      overrides: { 'lumirelle/node/rules': { rules: { 'node/no-path-concat': 'off' } } },
    }))

    expect(rules['node/no-path-concat']).toBe('off')
    expect(rules['node/no-new-require']).toBe('error')
  })

  it('rejects a name Source did not emit, such as a row the derivation dropped', async () => {
    // The `bin` row exists only while the imports Module turns its rules on.
    expect(() => eslint({ gitignore: false, imports: false, overrides: { 'lumirelle/disables/bin': { files: ['**/*.js'] } } }))
      .toThrow(/lumirelle\/disables\/bin/)
  })
})
