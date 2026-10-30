import type { ConfigObject, Glob, Options, RuleKey } from '../types'
import { GLOB_TESTS } from '../globs'
import { pluginRef } from '../plugins'
import { rulesEnabledBy } from '../rules'

/** Options the `test` Module reads; the object form of `Options.test` adds rule overrides. */
export interface TestOptions {
  files?: Glob[]
  isInEditor?: boolean
  overrides?: NonNullable<ConfigObject['rules']>
  /** The rule keys the rest of the Source turned on; see {@link rulesEnabledBy}. */
  enabled?: ReadonlySet<RuleKey>
}

export function test(options: TestOptions = {}): ConfigObject[] {
  const {
    enabled = new Set<RuleKey>(),
    files = GLOB_TESTS,
    isInEditor = false,
    overrides = {},
  } = options

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
        'test/consistent-test-it': ['error', { fn: 'it', withinDescribe: 'it' }],
        'test/no-identical-title': 'error',
        'test/no-import-node-test': 'error',
        'test/prefer-hooks-in-order': 'error',
        'test/prefer-lowercase-title': 'error',

        'test/no-only-tests': isInEditor ? 'warn' : 'error',
        ...rulesEnabledBy(
          {
            'antfu/no-top-level-await': 'off',
            'e18e/prefer-static-regex': 'off',
            'no-unused-expressions': 'off',
            'node/prefer-global/process': 'off',
            'ts/explicit-function-return-type': 'off',
          },
          enabled,
        ),
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
  return typeof option === 'object' ? (option.overrides ?? {}) : {}
}
