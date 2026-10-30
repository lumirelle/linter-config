import type { ConfigObject } from '../types'
import { GLOB_YAML } from '../globs'
import { pluginRef } from '../plugins'

/**
 * Upstream's `configs/yaml.ts`: `eslint-plugin-yml` rules over `yaml-eslint-parser`.
 *
 * The parser is ESLint-only, so the Module never reaches the Oxlint Emission; it is recorded in
 * the Coverage report as `eslint-only-domain`.
 */
export function yaml(
  options: {
    stylistic?: boolean
    overrides?: ConfigObject['rules']
  } = {},
): ConfigObject[] {
  const { stylistic = false, overrides = {} } = options

  return [
    {
      name: 'lumirelle/yaml/setup',
      module: 'yaml',
      domain: 'data',
      plugins: {
        yaml: pluginRef('yaml'),
      },
    },
    {
      name: 'lumirelle/yaml/rules',
      module: 'yaml',
      domain: 'data',
      files: [GLOB_YAML],
      tools: {
        eslint: { parser: pluginRef('yaml') },
      },
      rules: {
        'yaml/block-mapping': 'error',
        'yaml/block-sequence': 'error',
        'yaml/no-empty-key': 'error',
        'yaml/no-empty-sequence-entry': 'error',
        'yaml/no-irregular-whitespace': 'error',
        'yaml/plain-scalar': 'error',

        'yaml/vue-custom-block/no-parsing-error': 'error',

        ...(stylistic
          ? {
              // The stylistic Module owns `style/spaced-comment`; the house turns that Module off by default,
              // so the disable travels with the slice that would otherwise enable it.
              'style/spaced-comment': 'off',
              'yaml/block-mapping-question-indicator-newline': 'error',
              'yaml/block-sequence-hyphen-indicator-newline': 'error',
              'yaml/flow-mapping-curly-newline': 'error',
              'yaml/flow-mapping-curly-spacing': 'error',
              'yaml/flow-sequence-bracket-newline': 'error',
              'yaml/flow-sequence-bracket-spacing': 'error',
              'yaml/indent': ['error', 2],
              'yaml/key-spacing': 'error',
              'yaml/no-multiple-empty-lines': ['error', { max: 1, maxBOF: 0, maxEOF: 0 }],
              'yaml/no-tab-indent': 'error',
              'yaml/quotes': ['error', { avoidEscape: true, prefer: 'single' }],
              'yaml/spaced-comment': 'error',
            }
          : {}),
        ...overrides,
      },
    },
  ]
}
