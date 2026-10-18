import type { ConfigObject, Options } from '../types'
import { pluginRef } from '../plugins'

/**
 * Upstream's `configs/imports.ts`: import hygiene, plus the three `antfu` import rules that have
 * no equivalent in `eslint-plugin-import-lite`.
 *
 * `eslint-plugin-import-lite` needs no resolver, so the module carries no `settings` and no
 * parser: both tools read the module as plain rules.
 *
 * Upstream gates `import/newline-after-import` on its stylistic option, which the house turns
 * off by default ({@link Options.stylistic}); the rest of the module is unconditional.
 */
export function imports(
  options: Pick<Options, 'stylistic'> & { overrides?: ConfigObject['rules'] } = {},
): ConfigObject[] {
  const { overrides = {}, stylistic = false } = options

  return [
    {
      name: 'lumirelle/imports/rules',
      module: 'imports',
      domain: 'js',
      plugins: {
        antfu: pluginRef('antfu'),
        import: pluginRef('import'),
      },
      rules: {
        'antfu/import-dedupe': 'error',
        'antfu/no-import-dist': 'error',
        'antfu/no-import-node-modules-by-path': 'error',

        'import/consistent-type-specifier-style': ['error', 'top-level'],
        'import/first': 'error',
        'import/no-duplicates': 'error',
        'import/no-mutable-exports': 'error',
        'import/no-named-default': 'error',

        ...stylistic
          ? {
              'import/newline-after-import': ['error', { count: 1 }],
            }
          : {},

        ...overrides,
      },
    },
  ]
}
