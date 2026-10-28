// @ts-check
import { eslint } from '@lumirelle/linter-config/eslint'

// An example consumer of `@lumirelle/linter-config/eslint`.
export default eslint({
  // A library, not an application: the library-specific slices of the `node`, `e18e` and
  // TypeScript Modules are enabled.
  type: 'lib',
  // Type-aware rules need the workspace's TypeScript config.
  typescript: { tsconfigPath: 'tsconfig.json' },
  // Package specific overrides.
  overrides: {
    'lumirelle/typescript/rules-type-aware': {
      files: ['packages/core/**/*.ts'],
      rules: {
        'ts/no-unsafe-assignment': 'off',
      },
    },
  },
})
