import type { OxlintConfig } from 'oxlint'
import { describe, expect, it } from 'vitest'
import { oxlint } from '../src/oxlint'
import { oxlintRules } from '../src/oxlint/inventory'
import { coverageReport } from '../src/oxlint/report'
import { pluginDefinition } from '../src/plugins'
import { jsPluginsOf } from './helpers/emission'
import { rulesFor } from './helpers/oxlint-emission'

type Options = Parameters<typeof oxlint>[0]

const TS_EXTENSIONS = ['.ts', '.cts', '.mts', '.tsx', '.ctsx', '.mtsx']

async function emission(options: Options = {}): Promise<OxlintConfig> {
  return oxlint({ gitignore: false, isInEditor: false, ...options })
}

/** Every rule the Emission sets for TypeScript files, the way Oxlint applies them. */
async function rules(options: Options = {}): Promise<Record<string, unknown>> {
  return rulesFor(await emission(options), TS_EXTENSIONS)
}

const TSCONFIG = { typescript: { tsconfigPath: 'tsconfig.json' } }

describe('oxlint() TypeScript rules', () => {
  it('maps the ts rules onto the built-in typescript scope', async () => {
    const emitted = await rules()

    expect(emitted['typescript/consistent-type-definitions']).toEqual(['error', 'interface'])
    expect(emitted['typescript/method-signature-style']).toEqual(['error', 'property'])
    expect(emitted['typescript/no-namespace']).toBe('error')
    expect(Object.keys(emitted).filter(key => key.startsWith('@typescript-eslint/'))).toEqual([])
  })

  it('keeps the core rules the preset carries unprefixed', async () => {
    const emitted = await rules()

    expect(emitted['no-undef']).toBe('off')
    expect(emitted['no-var']).toBe('error')
    expect(emitted['ts/no-explicit-any']).toBeUndefined()
  })

  it('scopes the TypeScript rules to TypeScript files', async () => {
    const config = await emission()
    const override = (config.overrides ?? []).find(
      override => 'typescript/no-namespace' in (override.rules ?? {}),
    )

    // Oxlint flattens the shared brace globs, so assert the extension set instead of the spelling.
    expect(override?.files?.length).toBeGreaterThan(0)
    for (const file of override?.files ?? []) {
      expect(TS_EXTENSIONS).toContain(`.${file.split('.').at(-1)}`)
    }
  })

  it('declares no jsPlugin for the typescript scope: Oxlint ships it itself', async () => {
    const declared = (await jsPluginsOf()).map(entry => `${entry.name}:${entry.specifier}`).sort()

    // The jsPlugin-backed Modules of the widest Source, and nothing for a built-in scope.
    expect(declared).toEqual([
      'antfu:eslint-plugin-antfu',
      'command:eslint-plugin-command',
      'e18e:@e18e/eslint-plugin',
      'perfectionist:eslint-plugin-perfectionist',
      'regexp:eslint-plugin-regexp',
      'unused-imports:eslint-plugin-unused-imports',
    ])
  })
})

describe('oxlint() type-aware TypeScript rules', () => {
  it('leaves them out while the type-aware mode is off', async () => {
    const emitted = await rules(TSCONFIG)

    for (const rule of [
      'typescript/no-floating-promises',
      'typescript/strict-boolean-expressions',
    ]) {
      expect(emitted[rule], rule).toBeUndefined()
    }
  })

  it('emits them under the built-in typescript scope once typeAware is on', async () => {
    const emitted = await rules({ ...TSCONFIG, oxlint: { typeAware: true } })

    expect(emitted['typescript/no-floating-promises']).toBe('error')
    expect(emitted['typescript/strict-boolean-expressions']).toEqual([
      'error',
      { allowNullableBoolean: true, allowNullableObject: true },
    ])
  })

  it('emits nothing type-aware while Source has no tsconfig, even with typeAware on', async () => {
    const emitted = await rules({ oxlint: { typeAware: true } })

    expect(emitted['typescript/no-floating-promises']).toBeUndefined()
  })

  it('drops the erasable-syntax-only rules, which only ESLint can run', async () => {
    const emitted = await rules({ typescript: { erasableOnly: true } })

    expect(Object.keys(emitted).some(key => key.startsWith('erasable-syntax-only/'))).toBe(false)
    expect(coverageReport().modules.typescript).toEqual(
      expect.arrayContaining([
        { key: 'erasable-syntax-only/enums', reason: 'no-oxlint-realization' },
      ]),
    )
  })
})

describe('the Coverage report over the TypeScript module', () => {
  it('lists every type-aware rule with the reason the Oxlint Emission drops it', () => {
    const entries = coverageReport().modules.typescript ?? []

    expect(
      entries
        .filter(entry => entry.reason === 'type-aware')
        .map(entry => entry.key)
        .sort(),
    ).toEqual([
      'ts/await-thenable',
      'ts/dot-notation',
      'ts/no-floating-promises',
      'ts/no-for-in-array',
      'ts/no-implied-eval',
      'ts/no-misused-promises',
      'ts/no-unnecessary-type-assertion',
      'ts/no-unsafe-argument',
      'ts/no-unsafe-assignment',
      'ts/no-unsafe-call',
      'ts/no-unsafe-member-access',
      'ts/no-unsafe-return',
      'ts/promise-function-async',
      'ts/restrict-plus-operands',
      'ts/restrict-template-expressions',
      'ts/return-await',
      'ts/strict-boolean-expressions',
      'ts/switch-exhaustiveness-check',
      'ts/unbound-method',
    ])
  })

  it('only calls a rule type-aware when the installed Oxlint agrees', () => {
    const scope = pluginDefinition('ts').oxlint?.builtin
    const inventory = new Map(oxlintRules().map(rule => [`${rule.scope}/${rule.rule}`, rule]))
    const typeAware = (coverageReport().modules.typescript ?? []).filter(
      entry => entry.reason === 'type-aware',
    )

    expect(typeAware.length).toBeGreaterThan(0)
    for (const entry of typeAware) {
      const rule = entry.key.slice('ts/'.length)
      expect(inventory.get(`${scope}/${rule}`)?.typeAware, entry.key).toBe(true)
    }
  })
})
