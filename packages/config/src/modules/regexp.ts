import type { ConfigObject } from '../types'
import { pluginRef } from '../plugins'
import { REGEXP_RECOMMENDED_RULES } from './plugin-rules.generated'

/**
 * @see https://github.com/ota-meshi/eslint-plugin-regexp
 */
export function regexp(): ConfigObject[] {
  return [
    {
      name: 'lumirelle/regexp/rules',
      module: 'regexp',
      domain: 'js',
      plugins: {
        regexp: pluginRef('regexp'),
      },
      rules: { ...REGEXP_RECOMMENDED_RULES },
    },
  ]
}
