import type { ConfigObject } from '../types'
import { requirePeerPackages } from '../packages'
import { pluginRef } from '../plugins'

/**
 * Upstream's `configs/unocss.ts`: `@unocss/eslint-plugin` for class ordering.
 *
 * Upstream also offers `attributify: false` and `strict: true`; Source has neither option yet, so
 * the Module always emits the attributify rule and never the blocklist one. Oxlint realizes the
 * plugin through `jsPlugins`, with the alias fixed to the Plugin id.
 */
export function unocss(): ConfigObject[] {
  requirePeerPackages('unocss', ['unocss'])

  return [
    {
      name: 'lumirelle/unocss/setup',
      module: 'unocss',
      domain: 'js',
      plugins: {
        unocss: pluginRef('unocss'),
      },
      rules: {
        'unocss/order': 'warn',
        'unocss/order-attributify': 'warn',
      },
    },
  ]
}
