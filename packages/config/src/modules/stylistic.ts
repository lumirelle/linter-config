import type { ConfigObject, StylisticOptions } from '../types'
import { pluginRef } from '../plugins'
import { stylisticCustomizeRules } from './stylistic-rules'

/**
 * Upstream's `StylisticConfigDefaults`: what the plugin's `customize()` is called with unless the
 * caller says otherwise. They are also the options the committed rule table was generated with.
 */
const CUSTOMIZE_DEFAULTS = {
  braceStyle: 'stroustrup',
  experimental: false,
  indent: 2,
  jsx: true,
  quotes: 'single',
  semi: false,
} as const

/**
 * Upstream's `configs/stylistic.ts`, off unless the caller asks for it through the shared
 * `stylistic` option.
 *
 * The rule table is `@stylistic/eslint-plugin`'s own `customize()` output, generated into
 * `./stylistic-rules.generated.ts` and patched per option, because Source imports no plugin package;
 * this Module adds the `antfu` opinionation on top and, with `lessOpinionated`, trades it for the
 * core `curly` rule, exactly where Upstream does. The object is global (no `files`), so it reaches
 * every file both tools can read.
 *
 * The `style` rules reach Oxlint through `jsPlugins` under the `style` alias the registry declares;
 * anything Oxlint cannot run is recorded in the Coverage report rather than dropped silently.
 */
export function stylistic(options: StylisticOptions = {}): ConfigObject[] {
  const { lessOpinionated = false, overrides = {} } = options
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

        ...customize.experimental
          ? {}
          : {
              'antfu/consistent-list-newline': 'error',
            },

        'antfu/consistent-chaining': 'error',

        ...lessOpinionated
          ? {
              curly: ['error', 'all'],
            }
          : {
              'antfu/curly': 'error',
              'antfu/if-newline': 'error',
              'antfu/top-level-function': 'error',
            },

        'style/generator-star-spacing': ['error', { after: true, before: false }],
        'style/yield-star-spacing': ['error', { after: true, before: false }],

        ...overrides,
      },
    },
  ]
}
