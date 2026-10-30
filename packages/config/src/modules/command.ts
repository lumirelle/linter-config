import type { ConfigObject } from '../types'
import { pluginRef } from '../plugins'

/**
 * @see https://eslint-plugin-command.antfu.me
 */
export function command(): ConfigObject[] {
  return [
    {
      name: 'lumirelle/command/rules',
      module: 'command',
      domain: 'js',
      plugins: {
        command: pluginRef('command'),
      },
      rules: {
        'command/command': 'error',
      },
    },
  ]
}
