import type { ConfigObject, StylisticOptions } from '../types'
import { requirePeerPackages } from '../packages'
import { pluginRef } from '../plugins'
import { stylisticCustomizeRules } from './stylistic-rules'

const CUSTOMIZE_DEFAULTS = {
  braceStyle: 'stroustrup',
  experimental: false,
  indent: 2,
  jsx: true,
  quotes: 'single',
  semi: false,
} as const

export function stylistic(options: StylisticOptions = {}): ConfigObject[] {
  const { lessOpinionated = false, overrides = {} } = options
  requirePeerPackages('stylistic', ['style'])
  const customize = {
    braceStyle: options.braceStyle ?? CUSTOMIZE_DEFAULTS.braceStyle,
    experimental: options.experimental ?? CUSTOMIZE_DEFAULTS.experimental,
    indent: options.indent ?? CUSTOMIZE_DEFAULTS.indent,
    jsx: options.jsx ?? CUSTOMIZE_DEFAULTS.jsx,
    quotes: options.quotes ?? CUSTOMIZE_DEFAULTS.quotes,
    semi: options.semi ?? CUSTOMIZE_DEFAULTS.semi,
  }

  return [
    {
      name: 'lumirelle/stylistic/rules',
      module: 'stylistic',
      domain: 'js',
      plugins: {
        antfu: pluginRef('antfu'),
        style: pluginRef('style'),
      },
      rules: {
        ...stylisticCustomizeRules(customize),

        ...(customize.experimental
          ? {}
          : {
              'antfu/consistent-list-newline': 'error',
            }),

        'antfu/consistent-chaining': 'error',

        ...(lessOpinionated
          ? {
              curly: ['error', 'all'],
            }
          : {
              'antfu/curly': 'error',
              'antfu/if-newline': 'error',
              'antfu/top-level-function': 'error',
            }),

        'style/generator-star-spacing': ['error', { after: true, before: false }],
        'style/yield-star-spacing': ['error', { after: true, before: false }],

        ...overrides,
      },
    },
  ]
}
