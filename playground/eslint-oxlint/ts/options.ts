import type { Options } from '@lumirelle/linter-config'

/**
 * The example's own options, the one object both configs are built from.
 */
export const options = {
  // A library, not an application: the library-specific slices of the `node`, `e18e` and
  // TypeScript Modules are enabled.
  type: 'lib',
  // Type-aware rules need the project's TypeScript config, on both sides: Oxlint reads them in its
  // own type-aware mode, which is what makes the `oxlint` object below more than a Bridge flag.
  typescript: { tsconfigPath: 'tsconfig.json' },
  oxlint: { typeAware: true },
} satisfies Options
