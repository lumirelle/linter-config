import type { ConfigObject } from '../types'
import { pluginRef } from '../plugins'

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
