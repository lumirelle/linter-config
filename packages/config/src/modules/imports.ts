import type { ConfigObject, Options } from '../types'
import { pluginRef } from '../plugins'

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

        ...(stylistic
          ? {
              'import/newline-after-import': ['error', { count: 1 }],
            }
          : {}),

        ...overrides,
      },
    },
  ]
}
