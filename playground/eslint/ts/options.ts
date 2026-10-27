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
  // Type-aware rules need the project's TypeScript config. Without the `oxlint` option there is no
  // Bridge, so this Emission carries every rule the stack turns on instead of one with rules
  // switched off for a tool the project does not run.
  typescript: { tsconfigPath: 'tsconfig.json' },
  // Upstream reads the `test` Module inline and defaults it on; the example states it because the
  // source tree includes a test file.
  test: true,
} satisfies Options
