import type { ConfigObject } from '../types'
import { requirePeerPackages } from '../packages'
import { pluginRef } from '../plugins'

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
