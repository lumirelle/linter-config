import type { ConfigObject } from '../types'
import { pluginRef } from '../plugins'

/**
 * Upstream's `configs/comments.ts`: the four `eslint-comments` rules that keep disable-directive
 * bookkeeping honest.
 *
 * The Module is ESLint-only in practice: Oxlint cannot run the plugin's `no-unlimited-disable`
 * (see `src/oxlint/blacklist.ts`), so the Oxlint Adapter drops these rules and the Coverage
 * report records each as `blacklisted-plugin`. The plugin object stays declared here because the
 * ESLint Emission is where the Module has its effect.
 */
export function eslintComments(): ConfigObject[] {
  return [
    {
      name: 'lumirelle/eslint-comments/rules',
      module: 'eslint-comments',
      domain: 'js',
      plugins: {
        'eslint-comments': pluginRef('eslint-comments'),
      },
      rules: {
        'eslint-comments/no-aggregating-enable': 'error',
        'eslint-comments/no-duplicate-disable': 'error',
        'eslint-comments/no-unlimited-disable': 'error',
        'eslint-comments/no-unused-enable': 'error',
      },
    },
  ]
}
