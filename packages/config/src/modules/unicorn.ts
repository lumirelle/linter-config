import type { ConfigObject } from '../types'
import { GLOB_SRC } from '../globs'
import { pluginRef } from '../plugins'

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

        ...options.overrides,
      },
    },
  ]
}
