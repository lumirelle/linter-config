import type { ConfigObject } from '../types'
import { GLOB_JSON, GLOB_JSON5, GLOB_JSONC } from '../globs'
import { pluginRef } from '../plugins'

/** Upstream's unconditional JSON correctness rules; none of them has an Oxlint counterpart. */
const UPSTREAM_RULES: ConfigObject['rules'] = {
  'jsonc/no-bigint-literals': 'error',
  'jsonc/no-binary-expression': 'error',
  'jsonc/no-binary-numeric-literals': 'error',
  'jsonc/no-dupe-keys': 'error',
  'jsonc/no-escape-sequence-in-identifier': 'error',
  'jsonc/no-floating-decimal': 'error',
  'jsonc/no-hexadecimal-numeric-literals': 'error',
  'jsonc/no-infinity': 'error',
  'jsonc/no-multi-str': 'error',
  'jsonc/no-nan': 'error',
  'jsonc/no-number-props': 'error',
  'jsonc/no-numeric-separators': 'error',
  'jsonc/no-octal': 'error',
  'jsonc/no-octal-escape': 'error',
  'jsonc/no-octal-numeric-literals': 'error',
  'jsonc/no-parenthesized': 'error',
  'jsonc/no-plus-sign': 'error',
  'jsonc/no-regexp-literals': 'error',
  'jsonc/no-sparse-arrays': 'error',
  'jsonc/no-template-literals': 'error',
  'jsonc/no-undefined-value': 'error',
  'jsonc/no-unicode-codepoint-escapes': 'error',
  'jsonc/no-useless-escape': 'error',
  'jsonc/space-unary-ops': 'error',
  'jsonc/valid-json-number': 'error',
  'jsonc/vue-custom-block/no-parsing-error': 'error',
}

/** Upstream's stylistic slice; the house turns it off through {@link Options.stylistic}. */
const STYLISTIC_RULES: ConfigObject['rules'] = {
  'jsonc/array-bracket-spacing': ['error', 'never'],
  'jsonc/comma-dangle': ['error', 'never'],
  'jsonc/comma-style': ['error', 'last'],
  'jsonc/indent': ['error', 2],
  'jsonc/key-spacing': ['error', { afterColon: true, beforeColon: false }],
  'jsonc/object-curly-newline': ['error', { consistent: true, multiline: true }],
  'jsonc/object-curly-spacing': ['error', 'always'],
  'jsonc/object-property-newline': ['error', { allowAllPropertiesOnSameLine: true }],
  'jsonc/quote-props': 'error',
  'jsonc/quotes': 'error',
}

/**
 * Upstream's `configs/jsonc.ts`: `eslint-plugin-jsonc` correctness rules for JSON, JSON5 and JSONC.
 *
 * The rules object carries `language: 'jsonc/x'`, which is an ESLint-only field: Oxlint has no
 * parser hook, so the whole Module is filtered out of the Oxlint Emission and recorded in the
 * Coverage report as `eslint-only-domain`.
 */
export function jsonc(options: {
  stylistic?: boolean
  overrides?: ConfigObject['rules']
} = {}): ConfigObject[] {
  const { stylistic = false, overrides = {} } = options

  return [
    {
      name: 'lumirelle/jsonc/setup',
      module: 'jsonc',
      domain: 'data',
      plugins: {
        jsonc: pluginRef('jsonc'),
      },
    },
    {
      name: 'lumirelle/jsonc/rules',
      module: 'jsonc',
      domain: 'data',
      files: [GLOB_JSON, GLOB_JSON5, GLOB_JSONC],
      tools: {
        eslint: { language: 'jsonc/x' },
      },
      rules: {
        ...UPSTREAM_RULES,
        ...stylistic ? STYLISTIC_RULES : {},
        ...overrides,
      },
    },
  ]
}
