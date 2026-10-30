import type { Options } from '@lumirelle/linter-config'

/**
 * The workspace's own options, the one object every package is linted from.
 */
export const options = {
  // A library, not an application: the library-specific slices of the `node`, `e18e` and
  // TypeScript Modules are enabled.
  type: 'lib',
  // Type-aware rules need the workspace's TypeScript config, on both sides: Oxlint reads them in
  // its own type-aware mode, which is what makes the `oxlint` object below more than a Bridge flag.
  typescript: { tsconfigPath: 'tsconfig.json' },
  oxlint: { typeAware: true },
  // Package specific overrides.
  overrides: {
    'lumirelle/typescript/rules-type-aware': {
      files: ['packages/core/**/*.ts'],
      rules: {
        'ts/no-unsafe-assignment': 'off',
      },
    },
  },
} satisfies Options
