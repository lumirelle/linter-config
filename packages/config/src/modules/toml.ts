import type { ConfigObject } from '../types'
import { GLOB_TOML } from '../globs'
import { pluginRef } from '../plugins'

/** Upstream's unconditional TOML rules. */
const HOUSE_RULES: ConfigObject['rules'] = {
  'toml/comma-style': 'error',
  'toml/keys-order': 'error',
  'toml/no-space-dots': 'error',
  'toml/no-unreadable-number-separator': 'error',
  'toml/precision-of-fractional-seconds': 'error',
  'toml/precision-of-integer': 'error',
  'toml/tables-order': 'error',

  'toml/vue-custom-block/no-parsing-error': 'error',
}

/**
 * Upstream's stylistic slice, carrying the two house overrides the root `eslint.config.js` passes
 * as `toml.overrides`: arrays that are already multi-line stay that way, and brackets never get
 * inner padding. They are house style, so they live here rather than in a consumer's options; a
 * caller can still change them through `overrides.toml`.
 */
const STYLISTIC_RULES: ConfigObject['rules'] = {
  // The stylistic Module owns `style/spaced-comment`; the house turns that Module off by default,
  // so the disable travels with the slice that would otherwise enable it.
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

/**
 * Upstream's `configs/toml.ts`: `eslint-plugin-toml` rules over `toml-eslint-parser`.
 *
 * The parser is ESLint-only, so the Module never reaches the Oxlint Emission; it is recorded in
 * the Coverage report as `eslint-only-domain`.
 */
export function toml(options: {
  stylistic?: boolean
  overrides?: ConfigObject['rules']
} = {}): ConfigObject[] {
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
        ...HOUSE_RULES,
        ...stylistic ? STYLISTIC_RULES : {},
        ...overrides,
      },
    },
  ]
}
