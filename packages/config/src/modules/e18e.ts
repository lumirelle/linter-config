import type { ConfigObject, Options } from '../types'
import { pluginRef } from '../plugins'
import {
  E18E_MODERNIZATION_RULES,
  E18E_MODULE_REPLACEMENTS_RULES,
  E18E_PERFORMANCE_IMPROVEMENTS_RULES,
} from './plugin-rules.generated'

/**
 * The sets are the plugin's own `configs`, generated into `./plugin-rules.generated.ts`.
 *
 * `moduleReplacements` defaults to a conjunction of two other
 * options (`type === 'lib' && isInEditor`), which this Module computes at composition time rather
 * than flattening into a single flag.
 *
 * @see https://github.com/e18e/eslint-plugin
 */
export function e18e(options: Pick<Options, 'isInEditor' | 'type'> = {}): ConfigObject[] {
  const { isInEditor = false, type = 'app' } = options

  return [
    {
      name: 'lumirelle/e18e/rules',
      module: 'e18e',
      domain: 'js',
      plugins: {
        e18e: pluginRef('e18e'),
      },
      rules: {
        ...E18E_MODERNIZATION_RULES,
        ...(type === 'lib' && isInEditor ? E18E_MODULE_REPLACEMENTS_RULES : {}),
        ...E18E_PERFORMANCE_IMPROVEMENTS_RULES,

        // Too strict for an application, where the performance win is usually negligible.
        ...(type === 'lib' ? {} : { 'e18e/prefer-static-regex': 'off' }),

        // Opinionated enough to change behaviour, so off until a project asks for them.
        'e18e/prefer-array-at': 'off',
        'e18e/prefer-array-from-map': 'off',
        'e18e/prefer-array-to-reversed': 'off',
        'e18e/prefer-array-to-sorted': 'off',
        'e18e/prefer-array-to-spliced': 'off',
        'e18e/prefer-spread-syntax': 'off',
      },
    },
  ]
}
