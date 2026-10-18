import { describe, expect, it } from 'vitest'
import { coverageReport } from '../src/oxlint/report'
import { eslintObject, jsPluginsOf, oxlintObjectWith, rulesOf } from './helpers/emission'

describe('eslint() imports module', () => {
  it('emits one global rules object declaring both house plugins', async () => {
    const rules = await eslintObject('lumirelle/imports/rules')

    expect(Object.keys(rules.plugins ?? {}).sort()).toEqual(['antfu', 'import'])
    expect(rules.files).toBeUndefined()
    expect(rules.ignores).toBeUndefined()
  })

  it('carries the import and antfu rules Upstream enables', async () => {
    const rules = rulesOf(await eslintObject('lumirelle/imports/rules'))

    expect(rules['antfu/import-dedupe']).toBe('error')
    expect(rules['antfu/no-import-dist']).toBe('error')
    expect(rules['antfu/no-import-node-modules-by-path']).toBe('error')
    expect(rules['import/consistent-type-specifier-style']).toEqual(['error', 'top-level'])
    expect(rules['import/first']).toBe('error')
    expect(rules['import/no-duplicates']).toBe('error')
    expect(rules['import/no-mutable-exports']).toBe('error')
    expect(rules['import/no-named-default']).toBe('error')
  })

  it('leaves the stylistic rule out while the house stylistic option is off', async () => {
    expect(rulesOf(await eslintObject('lumirelle/imports/rules'))['import/newline-after-import']).toBeUndefined()
  })

  it('adds the stylistic rule when the caller turns stylistic on', async () => {
    const rules = rulesOf(await eslintObject('lumirelle/imports/rules', { stylistic: true }))

    expect(rules['import/newline-after-import']).toEqual(['error', { count: 1 }])
  })
})

describe('oxlint() imports module', () => {
  it('maps the import rules onto the built-in import scope', async () => {
    const rules = rulesOf(await oxlintObjectWith('import/first'))

    expect(rules['import/first']).toBe('error')
    expect(rules['import/no-duplicates']).toBe('error')
    expect(rules['import/no-mutable-exports']).toBe('error')
    expect(rules['import/no-named-default']).toBe('error')
  })

  it('keeps the antfu rules under their Plugin id and declares the package Oxlint loads', async () => {
    const override = await oxlintObjectWith('import/first')

    expect(rulesOf(override)['antfu/import-dedupe']).toBe('error')
    expect(await jsPluginsOf()).toContainEqual({ name: 'antfu', specifier: 'eslint-plugin-antfu' })
  })

  it('records the one rule whose options Oxlint rejects, instead of sending a broken config', () => {
    // Oxlint spells the option `prefer-top-level`; `import-lite` spells it `top-level`, and one
    // unknown option value makes Oxlint refuse the whole config.
    expect(coverageReport().modules.imports).toEqual([
      { key: 'import/consistent-type-specifier-style', reason: 'incompatible-options' },
    ])
  })
})
