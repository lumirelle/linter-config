import type { Options } from '@lumirelle/linter-config/eslint'

/**
 * The example's own options, the one object both configs are built from.
 *
 * This is the direct replacement for the starter's `antfu({ type: 'lib', pnpm: true, antislop: true })`
 * call; `README.md` maps each field.
 */
export const options = {
  // A library, not an application: the library-specific slices of the `node`, `e18e` and
  // TypeScript Modules stay on.
  type: 'lib',
  // Type-aware rules need the project's TypeScript config, on both sides: Oxlint reads them in its
  // own type-aware mode, which is what makes the `oxlint` object below more than a Bridge flag.
  typescript: { tsconfigPath: 'tsconfig.json' },
  oxlint: { typeAware: true },
  // Upstream reads the `test` Module inline and defaults it on; the example states it because the
  // source tree includes a test file.
  test: true,
} satisfies Options
