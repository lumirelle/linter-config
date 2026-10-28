// @ts-check
import { eslint } from '@lumirelle/linter-config/eslint'

// An example consumer of `@lumirelle/linter-config/eslint`.
export default eslint({
  // A browser extension is an application, not a library: nothing here is published for import,
  // so the library-only slices of the `e18e` and `typescript` Modules are disabled.
  type: 'app',
  // Ignore build output.
  ignores: ['dist/**', 'extension/**', '.output/**'],
})
