import type { Options } from '@lumirelle/linter-config'

/**
 * The example's own options, the one object both configs are built from.
 */
export const options = {
  // A browser extension is an application, not a library: nothing here is published for import,
  // so the library-only slices of the `e18e` and `typescript` Modules are disabled.
  type: 'app',
  // Ignore build output.
  ignores: ['dist/**', 'extension/**', '.output/**'],
} satisfies Options
