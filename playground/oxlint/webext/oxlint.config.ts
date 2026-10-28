// @ts-check
import { oxlint } from '@lumirelle/linter-config/oxlint'

// An example consumer of `@lumirelle/linter-config/oxlint`.
export default oxlint({
  // A browser extension is an application, not a library: nothing here is published for import,
  // so the library-only slices of the `e18e` and `typescript` Modules are disabled.
  type: 'app',
  // Ignore build output.
  ignores: ['dist/**', 'extension/**', '.output/**'],
})
