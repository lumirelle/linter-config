import type { ConfigObject } from '../types'
import { GLOB_SRC } from '../globs'
import { pluginRef } from '../plugins'

/** The rules Upstream's `unicorn` config enables unless `allRecommended` replaces them. */
const HOUSE_RULES: ConfigObject['rules'] = {
  'unicorn/consistent-empty-array-spread': 'error',
  'unicorn/error-message': 'error',
  'unicorn/escape-case': 'error',
  'unicorn/new-for-builtins': 'error',
  'unicorn/no-instanceof-builtins': 'error',
  'unicorn/no-new-array': 'error',
  'unicorn/no-new-buffer': 'error',
  'unicorn/number-literal-case': 'error',
  'unicorn/prefer-dom-node-text-content': 'error',
  'unicorn/prefer-includes': 'error',
  'unicorn/prefer-node-protocol': 'error',
  'unicorn/prefer-number-properties': 'error',
  'unicorn/prefer-string-starts-ends-with': 'error',
  'unicorn/prefer-type-error': 'error',
  'unicorn/throw-new-error': 'error',
}

/**
 * Upstream's `configs/unicorn.ts`: a setup object that only declares the plugin, then the house
 * `unicorn` rules for source files.
 *
 * Upstream's `allRecommended` option replaces {@link HOUSE_RULES} with its plugin's
 * `configs.recommended.rules` at runtime. Source imports no plugin package, so the house table is
 * the ported slice; the recommended preset is not carried yet.
 *
 * The plugin reads no `settings` and needs no parser, so the Module emits plain rules.
 */
export function unicorn(options: { overrides?: ConfigObject['rules'] } = {}): ConfigObject[] {
  return [
    {
      name: 'lumirelle/unicorn/setup',
      module: 'unicorn',
      domain: 'js',
      plugins: {
        unicorn: pluginRef('unicorn'),
      },
    },
    {
      name: 'lumirelle/unicorn/rules',
      module: 'unicorn',
      domain: 'js',
      files: [GLOB_SRC],
      rules: {
        ...HOUSE_RULES,
        ...options.overrides,
      },
    },
  ]
}
