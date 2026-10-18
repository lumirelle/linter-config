import type { ConfigObject } from '../types'
import { GLOB_SRC } from '../globs'
import { pluginRef } from '../plugins'

/**
 * Upstream's `configs/node.ts`: `eslint-plugin-n` hygiene for source files.
 *
 * The plugin needs no settings of its own here: Upstream enables none of the rules that read the
 * Node version from `settings.n`, so the module carries no `settings`.
 */
export function node(): ConfigObject[] {
  return [
    {
      name: 'lumirelle/node/setup',
      module: 'node',
      domain: 'js',
      plugins: {
        node: pluginRef('node'),
      },
    },
    {
      name: 'lumirelle/node/rules',
      module: 'node',
      domain: 'js',
      files: [GLOB_SRC],
      rules: {
        'node/handle-callback-err': ['error', '^(err|error)$'],
        'node/no-deprecated-api': 'error',
        'node/no-exports-assign': 'error',
        'node/no-new-require': 'error',
        'node/no-path-concat': 'error',
        'node/prefer-global/buffer': ['error', 'never'],
        'node/prefer-global/process': ['error', 'never'],
        'node/process-exit-as-throw': 'error',
      },
    },
  ]
}
