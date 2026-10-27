// @ts-check
import { eslint } from '@lumirelle/linter-config/eslint'

// An example consumer of `@lumirelle/linter-config/eslint`: the options are written where the
// factory is called, because a project that runs ESLint alone has no second config to share them
// with, and the package owns every rule.
export default eslint({
  // A browser extension is an application, not a library: nothing here is published for import,
  // so the library-only slices of the `e18e` and `typescript` Modules stay off.
  type: 'app',
  // Upstream reads the `test` Module inline and defaults it on; the example states it because the
  // source tree includes a test file for the URL check both entry points share.
  test: true,
  // Build output is not source: neither tool should lint a bundled file. `dist` is the bundler's
  // default output, `extension` is the packable directory `web-ext` loads, and `.output` is where
  // a build integration that keeps both writes. Each Adapter carries the list in its own global
  // form: a `files`-less Config object here, because without the `oxlint` option there is no Bridge
  // and ESLint is the only reporter.
  ignores: ['dist/**', 'extension/**', '.output/**'],
})
