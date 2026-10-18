import { describe, expect, it } from 'vitest'
import { eslint } from '../src/eslint'
import { oxlint } from '../src/oxlint'
import { eslintObject, oxlintObjectWith, rulesOf } from './helpers/emission'

/** The house Emission: `.gitignore` reading and editor detection pinned, so nothing reads the cwd. */
const HOUSE = { gitignore: false, isInEditor: false } as const

/** `@stylistic/eslint-plugin`'s own default for the plugin name Source renames to `style`. */
const STYLE_PLUGIN = '@stylistic/eslint-plugin'

/** Every rule key either Emission carries, in Emission order. */
function ruleKeys(configs: Array<{ rules?: Record<string, unknown> }>): string[] {
  return configs.flatMap(config => Object.keys(config.rules ?? {}))
}

describe('the stylistic Module is off by default', () => {
  it('ships no stylistic rule and no stylistic plugin on the ESLint side', async () => {
    const configs = await eslint(HOUSE)

    expect(configs.filter(config => config.name?.includes('stylistic'))).toEqual([])
    expect(ruleKeys(configs).filter(key => key.startsWith('style/'))).toEqual([])
    expect(configs.flatMap(config => Object.keys(config.plugins ?? {}))).not.toContain('style')
  })

  it('ships no stylistic rule and no @stylistic specifier on the Oxlint side', async () => {
    const config = await oxlint(HOUSE)

    expect(ruleKeys(config.overrides ?? []).filter(key => key.startsWith('style/'))).toEqual([])
    expect(JSON.stringify(config)).not.toContain('@stylistic')
  })
})

describe('eslint() stylistic module', () => {
  it('emits one global rules object declaring both house plugins', async () => {
    const rules = await eslintObject('lumirelle/stylistic/rules', { stylistic: true })

    expect(Object.keys(rules.plugins ?? {}).sort()).toEqual(['antfu', 'style'])
    expect(rules.files).toBeUndefined()
    expect(rules.ignores).toBeUndefined()
  })

  it('carries the rule table customize() produces for the house defaults', async () => {
    const rules = rulesOf(await eslintObject('lumirelle/stylistic/rules', { stylistic: true }))

    expect(rules['style/array-bracket-spacing']).toEqual(['error', 'never'])
    expect(rules['style/brace-style']).toEqual(['error', 'stroustrup', { allowSingleLine: true }])
    expect(rules['style/quotes']).toEqual(['error', 'single', { allowTemplateLiterals: 'always', avoidEscape: false }])
    expect(rules['style/semi']).toEqual(['error', 'never'])
    expect(rules['style/indent']).toEqual(['error', 2, expect.objectContaining({ tabLength: 2 })])
    expect(rules['style/indent-binary-ops']).toEqual(['error', 2])
    expect(rules['style/jsx-indent-props']).toEqual(['error', 2])
    expect(rules['style/no-tabs']).toEqual('error')
  })

  it('carries the antfu rules and the two star-spacing overrides Upstream adds on top', async () => {
    const rules = rulesOf(await eslintObject('lumirelle/stylistic/rules', { stylistic: true }))

    expect(rules['antfu/consistent-list-newline']).toBe('error')
    expect(rules['antfu/consistent-chaining']).toBe('error')
    expect(rules['antfu/curly']).toBe('error')
    expect(rules['antfu/if-newline']).toBe('error')
    expect(rules['antfu/top-level-function']).toBe('error')
    expect(rules['style/generator-star-spacing']).toEqual(['error', { after: true, before: false }])
    expect(rules['style/yield-star-spacing']).toEqual(['error', { after: true, before: false }])
  })

  it('honors the customize options the object form passes', async () => {
    const semi = rulesOf(await eslintObject('lumirelle/stylistic/rules', { stylistic: { semi: true } }))
    const double = rulesOf(await eslintObject('lumirelle/stylistic/rules', { stylistic: { indent: 4, quotes: 'double' } }))
    const tab = rulesOf(await eslintObject('lumirelle/stylistic/rules', { stylistic: { indent: 'tab' } }))

    expect(semi['style/semi']).toEqual(['error', 'always'])
    expect(semi['style/member-delimiter-style']).toEqual(['error', expect.objectContaining({
      multiline: { delimiter: 'semi', requireLast: true },
      singleline: { delimiter: 'semi' },
    })])
    expect(double['style/quotes']).toEqual(['error', 'double', { allowTemplateLiterals: 'always', avoidEscape: false }])
    expect(double['style/indent']).toEqual(['error', 4, expect.objectContaining({ tabLength: 4 })])
    expect(double['style/indent-binary-ops']).toEqual(['error', 4])
    expect(tab['style/indent']).toEqual(['error', 'tab', expect.objectContaining({ tabLength: 4 })])
    expect(tab['style/no-tabs']).toBe('off')
  })

  it('carries the caller indent options verbatim, the way customize() takes them', async () => {
    const rules = rulesOf(await eslintObject('lumirelle/stylistic/rules', { stylistic: { indent: [4, { SwitchCase: 2 }] } }))

    expect(rules['style/indent']).toEqual(['error', 4, { SwitchCase: 2 }])
  })

  it('swaps the antfu opinionation for the core curly rule when lessOpinionated is set', async () => {
    const rules = rulesOf(await eslintObject('lumirelle/stylistic/rules', { stylistic: { lessOpinionated: true } }))

    expect(rules.curly).toEqual(['error', 'all'])
    expect(rules['antfu/curly']).toBeUndefined()
    expect(rules['antfu/if-newline']).toBeUndefined()
    expect(rules['antfu/top-level-function']).toBeUndefined()
    expect(rules['antfu/consistent-chaining']).toBe('error')
  })

  it('drops the antfu list-newline rule once the experimental rules replace it', async () => {
    const rules = rulesOf(await eslintObject('lumirelle/stylistic/rules', { stylistic: { experimental: true } }))

    expect(rules['antfu/consistent-list-newline']).toBeUndefined()
    expect(rules['style/exp-list-style']).toBe('error')
    expect(rules['style/object-curly-spacing']).toBe('off')
  })

  it('drops the JSX slice when the caller turns JSX off', async () => {
    const rules = rulesOf(await eslintObject('lumirelle/stylistic/rules', { stylistic: { jsx: false } }))

    expect(rules['style/jsx-quotes']).toBeUndefined()
    expect(rules['style/jsx-indent-props']).toBeUndefined()
    expect(rules['style/semi']).toEqual(['error', 'never'])
  })

  it('lets the shared override map refine one rule of the module', async () => {
    const rules = rulesOf(await eslintObject('lumirelle/stylistic/rules', {
      stylistic: true,
      overrides: { stylistic: { rules: { 'style/semi': 'warn' } } },
    }))

    expect(rules['style/semi']).toBe('warn')
  })
})

describe('oxlint() stylistic module', () => {
  it('maps the style rules onto the alias and declares the plugin Oxlint loads', async () => {
    const override = await oxlintObjectWith('style/semi', { stylistic: true })
    const rules = rulesOf(override)

    expect(rules['style/semi']).toEqual(['error', 'never'])
    expect(rules['style/quotes']).toEqual(['error', 'single', { allowTemplateLiterals: 'always', avoidEscape: false }])
    expect(rules['antfu/consistent-chaining']).toBe('error')
    expect(override.jsPlugins).toEqual(expect.arrayContaining([
      { name: 'style', specifier: STYLE_PLUGIN },
      { name: 'antfu', specifier: 'eslint-plugin-antfu' },
    ]))
  })

  it('honors the same customize options as the ESLint side', async () => {
    const rules = rulesOf(await oxlintObjectWith('style/semi', { stylistic: { semi: true } }))

    expect(rules['style/semi']).toEqual(['error', 'always'])
  })

  it('keeps the core curly rule the lessOpinionated branch emits', async () => {
    const rules = rulesOf(await oxlintObjectWith('style/semi', { stylistic: { lessOpinionated: true } }))

    expect(rules.curly).toEqual(['error', 'all'])
  })

  it('emits every style rule it carries under the declared alias, so Oxlint can resolve them', async () => {
    const override = await oxlintObjectWith('style/semi', { stylistic: true })
    const keys = Object.keys(override.rules ?? {}).filter(key => key.startsWith('style/'))
    const aliases = (override.jsPlugins ?? []).map(entry => (typeof entry === 'string' ? entry : entry.name))

    expect(aliases).toContain('style')
    expect(keys.every(key => key.split('/')[0] === 'style')).toBe(true)
  })
})
