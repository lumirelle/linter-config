// @ts-check
import { oxlint } from '@lumirelle/linter-config/oxlint'

// The Oxlint Emission of the options below, which a project that runs Oxlint alone writes where
// the factory is called: there is no second config to share them with. Oxlint discovers this file
// without a `-c` flag; do not keep an `.oxlintrc.json` beside it, because Oxlint refuses to load
// both.
export default oxlint({
  // A library, not an application: the library-specific slices of the `node`, `e18e` and
  // TypeScript Modules stay on.
  type: 'lib',
  // Type-aware rules need the project's TypeScript config, which Oxlint reads in its own type-aware
  // mode: that is the whole job of the `oxlint` object here. It is the value the paired flavor sets
  // too, because the entry describes the stack rather than the linter this example ships.
  typescript: { tsconfigPath: 'tsconfig.json' },
  oxlint: { typeAware: true },
  // Upstream reads the `test` Module inline and defaults it on; the example states it because the
  // source tree includes a test file.
  test: true,
})
