import type { ConfigObject } from '../types'
import { pluginRef } from '../plugins'
import { REGEXP_RECOMMENDED_RULES } from './plugin-rules.generated'

/**
 * Upstream's `configs/regexp.ts`: `eslint-plugin-regexp`'s `flat/recommended` set.
 *
 * The table is the plugin's own recommended set, generated into `./plugin-rules.generated.ts`
 * because Source imports no plugin package. It also switches seven rules of the `eslint` scope on
 * or off, which both Emissions read as core rules; everything `regexp/`-prefixed reaches Oxlint
 * through the `regexp` alias the registry declares.
 *
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
