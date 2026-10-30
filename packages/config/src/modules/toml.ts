import type { ConfigObject } from '../types'
import { GLOB_TOML } from '../globs'
import { pluginRef } from '../plugins'

export function toml(
  options: {
    stylistic?: boolean
    overrides?: ConfigObject['rules']
  } = {},
): ConfigObject[] {
  const { stylistic = false, overrides = {} } = options

  return [
    {
      name: 'lumirelle/toml/setup',
      module: 'toml',
      domain: 'data',
      plugins: {
        toml: pluginRef('toml'),
      },
    },
    {
      name: 'lumirelle/toml/rules',
      module: 'toml',
      domain: 'data',
      files: [GLOB_TOML],
      tools: {
        eslint: { parser: pluginRef('toml') },
      },
      rules: {
        'toml/comma-style': 'error',
        'toml/keys-order': 'error',
        'toml/no-space-dots': 'error',
        'toml/no-unreadable-number-separator': 'error',
        'toml/precision-of-fractional-seconds': 'error',
        'toml/precision-of-integer': 'error',
        'toml/tables-order': 'error',

        'toml/vue-custom-block/no-parsing-error': 'error',

        ...(stylistic
          ? {
              'style/spaced-comment': 'off',
              'toml/array-bracket-newline': 'error',
              'toml/array-bracket-spacing': ['error', 'never'],
              'toml/array-element-newline': ['error', 'consistent'],
              'toml/indent': ['error', 2],
              'toml/inline-table-curly-spacing': 'error',
              'toml/key-spacing': 'error',
              'toml/padding-line-between-pairs': 'error',
              'toml/padding-line-between-tables': 'error',
              'toml/quoted-keys': 'error',
              'toml/spaced-comment': 'error',
              'toml/table-bracket-spacing': 'error',
            }
          : {}),

        ...overrides,
      },
    },
  ]
}
