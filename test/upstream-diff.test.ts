import type { ComparableConfig } from '../scripts/upstream-diff'
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import {
  buildReport,
  gateUpstreamOptions,
  moduleOfConfigName,
  normalizeConfigs,
  normalizeRuleKey,
  normalizeSeverity,
  renderReport,
} from '../scripts/upstream-diff'

function fixture(name: string): ComparableConfig[] {
  return JSON.parse(readFileSync(new URL(`./fixtures/upstream/${name}.json`, import.meta.url), 'utf8')) as ComparableConfig[]
}

const sourceConfigs = fixture('source')
const upstreamConfigs = fixture('upstream')

const baseline = { package: '@antfu/eslint-config', version: '9.5.1', tag: 'v9.5.1' }

const defaultsPoint = {
  id: 'defaults',
  sourceOptions: { stylistic: false },
  upstreamOptions: { stylistic: false },
  sourceConfigs,
  upstreamConfigs,
}

describe('normalizeSeverity', () => {
  it('reads both the string and the numeric ESLint spellings', () => {
    expect(['off', 1, 2, ['error', { allow: ['warn'] }], 5].map(normalizeSeverity)).toEqual([
      'off',
      'warn',
      'error',
      'error',
      'unknown',
    ])
  })
})

describe('normalizeRuleKey', () => {
  it('maps every upstream plugin prefix to the canonical id', () => {
    const prefixes = {
      '@typescript-eslint/no-explicit-any': 'ts/no-explicit-any',
      '@stylistic/semi': 'style/semi',
      'import-lite/no-duplicates': 'import/no-duplicates',
      'n/no-process-exit': 'node/no-process-exit',
      'vitest/no-focused-tests': 'test/no-focused-tests',
      'yml/indent': 'yaml/indent',
      'markdown/no-missing-label-refs': 'md/no-missing-label-refs',
      'sonarjs/no-duplicate-string': 'sonar/no-duplicate-string',
      'unicorn/prefer-node-protocol': 'unicorn/prefer-node-protocol',
      'no-console': 'no-console',
    }

    expect(Object.keys(prefixes).map(normalizeRuleKey)).toEqual(Object.values(prefixes))
  })
})

describe('moduleOfConfigName', () => {
  it('reads the Module from the config name after normalizing the upstream prefix', () => {
    expect(moduleOfConfigName('antfu/javascript/rules')).toBe('javascript')
    expect(moduleOfConfigName('lumirelle/ignores')).toBe('ignores')
    expect(moduleOfConfigName('antfu/disables/scripts')).toBe('disables')
  })

  it('folds upstream gitignore into the Module Source implements it in', () => {
    expect(moduleOfConfigName('antfu/gitignore')).toBe('ignores')
  })
})

describe('normalizeConfigs', () => {
  it('renames config objects and rule prefixes, and merges scopes with the same name', () => {
    const configs = normalizeConfigs([
      { name: 'antfu/javascript/rules', rules: { '@typescript-eslint/no-explicit-any': 'error' } },
      { name: 'antfu/javascript/rules', rules: { '@stylistic/semi': ['warn'] } },
    ])

    expect(configs).toEqual([
      {
        name: 'lumirelle/javascript/rules',
        module: 'javascript',
        rules: { 'style/semi': 'warn', 'ts/no-explicit-any': 'error' },
      },
    ])
  })
})

describe('gateUpstreamOptions', () => {
  it('turns off every Module Source does not implement and keeps data options as given', () => {
    const gated = gateUpstreamOptions(
      { typescript: { tsconfigPath: 'tsconfig.json' }, gitignore: false, isInEditor: false },
      ['ignores', 'javascript'],
    )

    expect(gated).toMatchObject({ typescript: false, vue: false, stylistic: false, gitignore: false, isInEditor: false })
  })

  it('keeps the option of a Module Source implements', () => {
    const gated = gateUpstreamOptions({ typescript: true, vue: true }, ['javascript', 'typescript'])

    expect(gated).toMatchObject({ typescript: true, vue: false })
  })
})

describe('buildReport', () => {
  const report = buildReport({ baseline, points: [defaultsPoint] })
  const point = report.points[0]!

  it('aligns Config objects by normalized name and marks implemented Modules', () => {
    const modules = point.modules.map(module => [module.module, module.implemented])

    expect(modules).toEqual([
      ['eslint-comments', false],
      ['ignores', true],
      ['javascript', true],
    ])
  })

  it('reports added, removed, and severity-changed rules per Config object', () => {
    const javascript = point.modules.find(module => module.module === 'javascript')
    const rules = javascript?.configs.find(config => config.name === 'lumirelle/javascript/rules')

    expect(rules).toMatchObject({
      status: 'aligned',
      added: [{ rule: 'style/semi', upstream: 'error' }],
      removed: [],
      severityChanged: [
        { rule: 'eqeqeq', source: 'off', upstream: 'error' },
        { rule: 'no-console', source: 'error', upstream: 'warn' },
      ],
    })
  })

  it('classifies a Module Source does not emit as not yet implemented instead of drift', () => {
    const comments = point.modules.find(module => module.module === 'eslint-comments')

    expect(comments).toMatchObject({
      implemented: false,
      summary: { added: 2, removed: 0, severityChanged: 0 },
      configs: [
        {
          name: 'lumirelle/eslint-comments/rules',
          status: 'upstream-only',
          added: [
            { rule: 'eslint-comments/no-unused-disable', upstream: 'error' },
            { rule: 'eslint-comments/no-unused-enable', upstream: 'warn' },
          ],
        },
      ],
    })
  })

  it('keeps an upstream Config object only once per name under the Module Source implements it in', () => {
    const ignores = point.modules.find(module => module.module === 'ignores')

    expect(ignores?.configs.map(config => [config.name, config.status])).toEqual([
      ['lumirelle/gitignore', 'upstream-only'],
      ['lumirelle/ignores', 'aligned'],
    ])
  })

  it('renders a reviewable Markdown report', () => {
    expect(renderReport(report)).toMatchSnapshot()
  })
})
