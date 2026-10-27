import type { Options } from '@lumirelle/linter-config/eslint'

/**
 * The example's own options, the one object the config is built from.
 *
 * This is the direct replacement for the starter's `antfu({ type: 'lib', pnpm: true, antislop: true })`
 * call; `../eslint-oxlint/ts/README.md` maps each field.
 */
export const options = {
  // A library, not an application: the library-specific slices of the `node`, `e18e` and
  // TypeScript Modules stay on.
  type: 'lib',
  // Type-aware rules need the project's TypeScript config, which Oxlint reads in its own type-aware
  // mode: that is the whole job of the `oxlint` object below here. The value is the paired flavor's,
  // because the entry describes the stack, not the linter this example ships.
  typescript: { tsconfigPath: 'tsconfig.json' },
  oxlint: { typeAware: true },
  // Upstream reads the `test` Module inline and defaults it on; the example states it because the
  // source tree includes a test file.
  test: true,
} satisfies Options
