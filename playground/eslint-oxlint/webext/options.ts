import type { Options } from '@lumirelle/linter-config/eslint'

/**
 * The example's own options, the one object both configs are built from.
 *
 * This is the direct replacement for the starter's `antfu({ toml: { overrides: {...} } },
 * ...oxlint.buildFromOxlintConfigFile('.oxlintrc.json'))` call; `README.md` maps each field.
 */
export const options = {
  // A browser extension is an application, not a library: nothing here is published for import,
  // so the library-only slices of the `e18e` and `typescript` Modules stay off.
  type: 'app',
  // Upstream reads the `test` Module inline and defaults it on; the example states it because the
  // source tree includes a test file for the URL check both entry points share.
  test: true,
  // Build output is not source: neither tool should lint a bundled file. `dist` is the bundler's
  // default output, `extension` is the packable directory `web-ext` loads, and `.output` is where
  // a build integration that keeps both writes. Each Adapter takes the list globally: a `files`-less
  // Config object on the ESLint side, the root `ignorePatterns` on the Oxlint side.
  ignores: ['dist/**', 'extension/**', '.output/**'],
} satisfies Options
