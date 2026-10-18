import type { ConfigObject } from '../types'
import { pluginRef } from '../plugins'

/**
 * Upstream's `configs/perfectionist.ts`: props and items sorting.
 *
 * The table is four rules with literal options, so Source carries it as data; the `perfectionist`
 * plugin reaches Oxlint through `jsPlugins` under the alias the registry declares.
 *
 * @see https://github.com/azat-io/eslint-plugin-perfectionist
 */
export function perfectionist(): ConfigObject[] {
  return [
    {
      name: 'lumirelle/perfectionist/setup',
      module: 'perfectionist',
      domain: 'js',
      plugins: {
        perfectionist: pluginRef('perfectionist'),
      },
      rules: {
        'perfectionist/sort-exports': ['error', { order: 'asc', type: 'natural' }],
        'perfectionist/sort-imports': ['error', {
          groups: [
            'type-import',
            ['type-parent', 'type-sibling', 'type-index', 'type-internal'],

            'value-builtin',
            'value-external',
            'value-internal',
            ['value-parent', 'value-sibling', 'value-index'],
            'side-effect',
            'ts-equals-import',
            'unknown',
          ],
          newlinesBetween: 'ignore',
          newlinesInside: 'ignore',
          order: 'asc',
          type: 'natural',
        }],
        'perfectionist/sort-named-exports': ['error', { order: 'asc', type: 'natural' }],
        'perfectionist/sort-named-imports': ['error', { order: 'asc', type: 'natural' }],
      },
    },
  ]
}
