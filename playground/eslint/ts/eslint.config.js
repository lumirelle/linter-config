// @ts-check
import { eslint } from '@lumirelle/linter-config/eslint'

// An example consumer of `@lumirelle/linter-config/eslint`: the options are written where the
// factory is called, because a project that runs ESLint alone has no second config to share them
// with, and the package owns every rule.
export default eslint({
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
})
