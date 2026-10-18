import type { OxlintConfig } from 'oxlint'
import { describe, expect, it } from 'vitest'
import { GLOB_EXCLUDE } from '../src/globs'
import { oxlint } from '../src/oxlint'
import { rulesFor } from './helpers/oxlint-emission'

type OxlintOptions = Parameters<typeof oxlint>[0]

const JS_EXTENSIONS = ['.js', '.jsx', '.cjs', '.mjs', '.cjsx', '.mjsx']

/** The house Emission, with `.gitignore` reading turned off so the result does not depend on the cwd. */
async function house(options: OxlintOptions = {}): Promise<OxlintConfig> {
  return oxlint({ gitignore: false, isInEditor: false, ...options })
}

/** Every rule the Emission sets for JavaScript files, the way Oxlint applies them. */
async function rules(options: OxlintOptions = {}): Promise<Record<string, unknown>> {
  return rulesFor(await house(options), JS_EXTENSIONS)
}

describe('oxlint() JavaScript rules', () => {
  it('emits core rules unprefixed, the way Oxlint spells its built-in eslint scope', async () => {
    const emitted = await rules()

    expect(emitted.eqeqeq).toEqual(['error', 'smart'])
    expect(emitted['no-console']).toEqual(['error', { allow: ['warn', 'error'] }])
    expect(emitted['no-undef']).toBe('error')
    expect(Object.keys(emitted).some(key => key.startsWith('eslint/'))).toBe(false)
  })

  it('drops the core rules the installed Oxlint does not implement', async () => {
    const emitted = await rules()

    // Recorded in `coverage.json`: Oxlint has a built-in `eslint` scope, but not these rules.
    for (const missing of ['no-dupe-args', 'no-octal', 'no-octal-escape', 'no-restricted-syntax', 'no-undef-init']) {
      expect(emitted[missing], missing).toBeUndefined()
    }
  })

  it('keeps jsPlugin rules under their Plugin id and declares the package Oxlint must load', async () => {
    const config = await house()
    const emitted = Object.assign({}, ...(config.overrides ?? []).map(override => override.rules ?? {}))
    const jsPlugins = (config.overrides ?? []).flatMap(override => override.jsPlugins ?? [])

    expect(emitted['antfu/no-top-level-await']).toBe('error')
    expect(emitted['unused-imports/no-unused-imports']).toBe('error')
    expect(emitted['unused-imports/no-unused-vars']).toEqual(['error', expect.objectContaining({ args: 'after-used' })])
    expect(jsPlugins).toEqual(expect.arrayContaining([
      { name: 'antfu', specifier: 'eslint-plugin-antfu' },
      { name: 'unused-imports', specifier: 'eslint-plugin-unused-imports' },
    ]))
  })
})

describe('oxlint() type-aware rules', () => {
  const typeAwareRule: OxlintOptions = {
    overrides: { javascript: { rules: { 'ts/no-floating-promises': 'error' } } },
  }

  it('drops a type-aware rule while the type-aware mode is off', async () => {
    const emitted = await rules(typeAwareRule)

    expect(emitted['typescript/no-floating-promises']).toBeUndefined()
  })

  it('emits it under the built-in typescript scope once typeAware is on', async () => {
    const emitted = await rules({ ...typeAwareRule, oxlint: { typeAware: true } })

    expect(emitted['typescript/no-floating-promises']).toBe('error')
  })
})

describe('oxlint() root options', () => {
  it('leaves them out when the caller sets none, so the Emission stays valid', async () => {
    const config = await house()

    expect(config.options).toBeUndefined()
  })

  it('passes typeAware and typeCheck through to the root options field', async () => {
    const config = await house({ oxlint: { typeAware: true, typeCheck: true } })

    expect(config.options).toEqual({ typeAware: true, typeCheck: true })
  })

  it('forwards only the keys the caller set', async () => {
    const config = await house({ oxlint: { typeCheck: true } })

    expect(config.options).toEqual({ typeCheck: true })
  })
})

describe('oxlint() global ignores', () => {
  it('turns the ignores object into root ignorePatterns instead of an override glob', async () => {
    const config = await house({ ignores: ['**/vendor'] })
    const ignorePatterns = config.ignorePatterns ?? []

    expect(ignorePatterns).toHaveLength(GLOB_EXCLUDE.length + 1)
    expect(ignorePatterns.at(-1)).toContain('vendor')
    expect((config.overrides ?? []).some(override => 'ignores' in override)).toBe(false)
  })

  it('keeps the caller\'s own patterns last, after the house list', async () => {
    const config = await house({ ignores: ['**/vendor', '**/generated'] })

    expect((config.ignorePatterns ?? []).slice(-2).map(pattern => pattern.replace(/^\//, '')))
      .toEqual(['**/vendor', '**/generated'])
  })
})
