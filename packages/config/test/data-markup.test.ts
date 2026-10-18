import type { Linter } from 'eslint'
import { fileURLToPath } from 'node:url'
import { ESLint } from 'eslint'
import { describe, expect, it } from 'vitest'
import { eslint } from '../src/eslint'
import { oxlint } from '../src/oxlint'
import { coverageReport } from '../src/oxlint/report'
import { source } from '../src/source'
import { eslintObject, houseOptions } from './helpers/emission'

const FIXTURES = fileURLToPath(new URL('./fixtures/data-markup/', import.meta.url))

/** The house config, linting the data and markup fixtures with the real ESLint. */
async function lintFixtures(): Promise<Map<string, Linter.LintMessage[]>> {
  const eslintApi = new ESLint({
    overrideConfigFile: true,
    overrideConfig: await eslint(houseOptions()),
    cwd: FIXTURES,
  })

  const results = await eslintApi.lintFiles(['.'])
  return new Map(results.map(result => [result.filePath.replace(FIXTURES, ''), result.messages]))
}

/** Only what the fixtures assert on: which rule, and where. */
function diagnostics(messages: Linter.LintMessage[]): Array<{ ruleId: string, line: number }> {
  return messages.map(message => ({ line: message.line ?? 0, ruleId: message.ruleId ?? '<parse error>' }))
}

describe('eslint() over the data and markup fixtures', () => {
  it('reports the JSON, YAML, TOML and Markdown violations', async () => {
    const fixtures = await lintFixtures()

    expect(diagnostics(fixtures.get('violations.json')!)).toEqual([
      { line: 3, ruleId: 'jsonc/no-dupe-keys' },
      { line: 4, ruleId: 'jsonc/no-hexadecimal-numeric-literals' },
      { line: 4, ruleId: 'jsonc/valid-json-number' },
      { line: 5, ruleId: 'jsonc/no-infinity' },
      { line: 5, ruleId: 'jsonc/valid-json-number' },
    ])
    expect(diagnostics(fixtures.get('violations.yaml')!)).toEqual([
      { line: 1, ruleId: 'yaml/block-mapping' },
      { line: 4, ruleId: 'yaml/block-sequence' },
    ])
    expect(diagnostics(fixtures.get('violations.md')!)).toEqual([
      { line: 1, ruleId: 'md/no-missing-atx-heading-space' },
    ])
  })

  it('reports the house TOML bracket rule', async () => {
    const messages = (await lintFixtures()).get('violations.toml')!

    expect(diagnostics(messages)).toEqual([
      { line: 2, ruleId: 'toml/array-bracket-spacing' },
      { line: 2, ruleId: 'toml/array-bracket-spacing' },
    ])
    // The house option is `never`: both complaints are the padding around the brackets.
    expect(messages.map(message => message.message)).toEqual([
      'There should be no space after \'[\'.',
      'There should be no space before \']\'.',
    ])
  })

  it('sorts package.json and tsconfig.json keys', async () => {
    const fixtures = await lintFixtures()

    expect(diagnostics(fixtures.get('package.json')!)).toEqual([{ line: 2, ruleId: 'jsonc/sort-keys' }])
    expect(diagnostics(fixtures.get('tsconfig.json')!)).toEqual([{ line: 2, ruleId: 'jsonc/sort-keys' }])
  })
})

describe('the data and markup Modules', () => {
  it('emit under stable names, in Upstream factory order', async () => {
    const names = (await eslint(houseOptions())).map(config => config.name)

    expect(names.filter(name => /jsonc|sort|yaml|toml|markdown|pnpm|formatter/.test(name!))).toEqual([
      'lumirelle/jsonc/setup',
      'lumirelle/jsonc/rules',
      'lumirelle/sort/package-json',
      'lumirelle/sort/tsconfig-json',
      'lumirelle/yaml/setup',
      'lumirelle/yaml/rules',
      'lumirelle/toml/setup',
      'lumirelle/toml/rules',
      'lumirelle/markdown/setup',
      'lumirelle/markdown/processor',
      'lumirelle/markdown/parser',
      'lumirelle/markdown/rules',
      'lumirelle/markdown/disables/code',
    ])
  })

  it('carry the ESLint-only language and parser wiring', async () => {
    expect((await eslintObject('lumirelle/jsonc/rules')).language).toBe('jsonc/x')
    expect((await eslintObject('lumirelle/markdown/parser')).language).toBe('md/gfm')

    const parsers = await Promise.all(
      ['lumirelle/yaml/rules', 'lumirelle/toml/rules'].map(async name =>
        ((await eslintObject(name)).languageOptions?.parser as { meta?: { name?: string } })?.meta?.name,
      ),
    )
    expect(parsers).toEqual(['yaml-eslint-parser', 'toml-eslint-parser'])
  })

  it('merge the Markdown processor with a pass-through', async () => {
    const processor = (await eslintObject('lumirelle/markdown/processor')).processor as { meta?: { name?: string } }

    expect(processor).toBeDefined()
    expect(processor.meta?.name).toBeTypeOf('string')
  })

  it('keep the two house TOML overrides', async () => {
    const rules = (await eslintObject('lumirelle/toml/rules')).rules

    expect(rules?.['toml/array-bracket-spacing' as never]).toEqual(['error', 'never'])
    expect(rules?.['toml/array-element-newline' as never]).toEqual(['error', 'consistent'])
  })
})

describe('the Oxlint Emission', () => {
  it('is unchanged by every data and markup Module', async () => {
    const withModules = await oxlint(houseOptions())
    const withoutModules = await oxlint(houseOptions({
      formatters: false,
      jsonc: false,
      markdown: false,
      pnpm: false,
      toml: false,
      yaml: false,
    }))

    expect(withModules).toEqual(withoutModules)
  })
})

describe('the Coverage report', () => {
  it('records every data and markup Module as eslint-only-domain', async () => {
    const report = coverageReport()

    for (const module of ['jsonc', 'sort', 'yaml', 'toml', 'markdown', 'pnpm', 'formatters'] as const) {
      const rules = report.modules[module] ?? []
      expect(rules.length, `${module} has no recorded rule`).toBeGreaterThan(0)
      expect(new Set(rules.map(rule => rule.reason)), module).toEqual(new Set(['eslint-only-domain']))
    }
  })
})

describe('the pnpm Module', () => {
  it('is off without a pnpm-workspace.yaml, and on when asked for', async () => {
    // The repository root has no `pnpm-workspace.yaml`, which is what Upstream detects.
    expect(source(houseOptions()).some(config => config.module === 'pnpm')).toBe(false)

    const names = (await eslint(houseOptions({ pnpm: true }))).map(config => config.name)
    expect(names).toContain('lumirelle/pnpm/package-json')
    expect(names).toContain('lumirelle/pnpm/pnpm-workspace-yaml')
    expect(names).toContain('lumirelle/pnpm/pnpm-workspace-yaml-sort')
  })
})

describe('the formatters Module', () => {
  it('is off by default and emits the plugin-free formatters when asked for', async () => {
    expect(source(houseOptions()).some(config => config.module === 'formatters')).toBe(false)

    const configs = await eslint(houseOptions({ formatters: true }))
    expect(configs.map(config => config.name).filter(name => name?.startsWith('lumirelle/formatter'))).toEqual([
      'lumirelle/formatter/setup',
      'lumirelle/formatter/css',
      'lumirelle/formatter/scss',
      'lumirelle/formatter/less',
      'lumirelle/formatter/html',
      'lumirelle/formatter/markdown',
      'lumirelle/formatter/graphql',
    ])
    expect(configs.some(config => config.rules && 'format/prettier' in config.rules)).toBe(true)
  })
})
