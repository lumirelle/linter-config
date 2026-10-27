// @ts-check
import { oxlint } from '@lumirelle/linter-config/oxlint'

// The Oxlint Emission of the options below, which a project that runs Oxlint alone writes where
// the factory is called: there is no second config to share them with. Oxlint discovers this file
// without a `-c` flag; do not keep an `.oxlintrc.json` beside it, because Oxlint refuses to load
// both.
export default oxlint({
  // A browser extension is an application, not a library: nothing here is published for import,
  // so the library-only slices of the `e18e` and `typescript` Modules stay off.
  type: 'app',
  // Upstream reads the `test` Module inline and defaults it on; the example states it because the
  // source tree includes a test file for the URL check both entry points share.
  test: true,
  // Build output is not source: neither tool should lint a bundled file. `dist` is the bundler's
  // default output, `extension` is the packable directory `web-ext` loads, and `.output` is where
  // a build integration that keeps both writes. Oxlint takes the list as the Emission's root
  // `ignorePatterns`, which is the global form on that side.
  ignores: ['dist/**', 'extension/**', '.output/**'],
})
