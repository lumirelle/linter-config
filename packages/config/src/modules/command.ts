import type { ConfigObject } from '../types'
import { pluginRef } from '../plugins'

/**
 * Upstream's `configs/command.ts`: comment-as-command codemods.
 *
 * The plugin's `/config` entry is one object with the plugin and its single rule, which Source
 * carries as data instead of spreading a third-party config. The rule reports only on a command
 * comment, so the Module is silent on ordinary files.
 *
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
