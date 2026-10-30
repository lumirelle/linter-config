import type { ConfigObject, Options } from '../types'
import { GLOB_SRC } from '../globs'
import { pluginRef } from '../plugins'

const STYLISTIC_RULES: ConfigObject['rules'] = {
  'jsdoc/check-alignment': 'warn',
  'jsdoc/multiline-blocks': 'warn',
}

export function jsdoc(options: Pick<Options, 'stylistic'> = {}): ConfigObject[] {
  const { stylistic = false } = options

  return [
    {
      name: 'lumirelle/jsdoc/setup',
      module: 'jsdoc',
      domain: 'js',
      plugins: {
        jsdoc: pluginRef('jsdoc'),
      },
    },
    {
      name: 'lumirelle/jsdoc/rules',
      module: 'jsdoc',
      domain: 'js',
      files: [GLOB_SRC],
      rules: {
        'jsdoc/check-access': 'warn',
        'jsdoc/check-param-names': 'warn',
        'jsdoc/check-property-names': 'warn',
        'jsdoc/check-types': 'warn',
        'jsdoc/empty-tags': 'warn',
        'jsdoc/implements-on-classes': 'warn',
        'jsdoc/no-defaults': 'warn',
        'jsdoc/no-multi-asterisks': 'warn',
        'jsdoc/require-param-name': 'warn',
        'jsdoc/require-property': 'warn',
        'jsdoc/require-property-description': 'warn',
        'jsdoc/require-property-name': 'warn',
        'jsdoc/require-returns-check': 'warn',
        'jsdoc/require-returns-description': 'warn',
        'jsdoc/require-yields-check': 'warn',

        ...(stylistic ? STYLISTIC_RULES : {}),
      },
    },
  ]
}
