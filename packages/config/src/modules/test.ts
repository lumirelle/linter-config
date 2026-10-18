import type { ConfigObject, Glob, Options, RuleKey } from '../types'
import { GLOB_TESTS } from '../globs'
import { pluginRef } from '../plugins'
import { rulesEnabledBy } from '../rules'

/** The rules `@vitest/eslint-plugin` contributes, which is the `test` rule prefix. */
const HOUSE_RULES: NonNullable<ConfigObject['rules']> = {
  'test/consistent-test-it': ['error', { fn: 'it', withinDescribe: 'it' }],
  'test/no-identical-title': 'error',
  'test/no-import-node-test': 'error',
  'test/prefer-hooks-in-order': 'error',
  'test/prefer-lowercase-title': 'error',
}

/**
 * Upstream turns these rules off inside test files, because a test file is a different place to
 * write code: assertions are expressions, modules load on import, and callbacks return promises.
 * A Module only carries the entry while another Module of this Source turned the rule on.
 */
const DISABLED_RULES: NonNullable<ConfigObject['rules']> = {
  'antfu/no-top-level-await': 'off',
  'e18e/prefer-static-regex': 'off',
  'no-unused-expressions': 'off',
  'node/prefer-global/process': 'off',
  'ts/explicit-function-return-type': 'off',
}

/** Options the `test` Module reads; the object form of `Options.test` adds rule overrides. */
export interface TestOptions {
  files?: Glob[]
  isInEditor?: boolean
  overrides?: NonNullable<ConfigObject['rules']>
  /** The rule keys the rest of the Source turned on; see {@link rulesEnabledBy}. */
  enabled?: ReadonlySet<RuleKey>
}

/**
 * Upstream's `configs/test.ts`: vitest rules for test files, with the house relaxations that make
 * a test file readable.
 *
 * The `test` Plugin id spans two packages — `@vitest/eslint-plugin` plus the `no-only-tests` rule
 * Upstream merges into it — and the Bundle forwards the merged object, so Source names one id.
 * `isInEditor` downgrades `no-only-tests` to a warning like the other autofixable rules.
 */
export function test(options: TestOptions = {}): ConfigObject[] {
  const { enabled = new Set<RuleKey>(), files = GLOB_TESTS, isInEditor = false, overrides = {} } = options

  return [
    {
      name: 'lumirelle/test/setup',
      module: 'test',
      domain: 'js',
      plugins: {
        test: pluginRef('test'),
      },
    },
    {
      name: 'lumirelle/test/rules',
      module: 'test',
      domain: 'js',
      files,
      rules: {
        ...HOUSE_RULES,
        'test/no-only-tests': isInEditor ? 'warn' : 'error',
        ...rulesEnabledBy(DISABLED_RULES, enabled),
        ...overrides,
      },
    },
  ]
}

/** Whether the `test` Module runs: Upstream reads the option inline and defaults it on. */
export function isTestEnabled(option: Options['test']): boolean {
  return option !== false
}

/** The rule overrides the object form of `Options.test` carries. */
export function testOverrides(option: Options['test']): NonNullable<ConfigObject['rules']> {
  return typeof option === 'object' ? option.overrides ?? {} : {}
}
