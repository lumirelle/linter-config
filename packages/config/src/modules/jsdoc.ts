import type { ConfigObject, Options } from '../types'
import { GLOB_SRC } from '../globs'
import { pluginRef } from '../plugins'

/** The rules Upstream enables whether or not its stylistic option is on; all of them warn. */
const UPSTREAM_RULES: ConfigObject['rules'] = {
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
}

/** The two alignment rules Upstream adds while its stylistic option is on. */
const STYLISTIC_RULES: ConfigObject['rules'] = {
  'jsdoc/check-alignment': 'warn',
  'jsdoc/multiline-blocks': 'warn',
}

/**
 * Upstream's `configs/jsdoc.ts`: `eslint-plugin-jsdoc` correctness rules for source files.
 *
 * The plugin needs no settings: Upstream enables no rule that reads `settings.jsdoc`. Its
 * stylistic slice follows {@link Options.stylistic}, which the house turns off by default.
 */
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
        ...UPSTREAM_RULES,
        ...stylistic ? STYLISTIC_RULES : {},
      },
    },
  ]
}
