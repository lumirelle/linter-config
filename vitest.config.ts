import { configDefaults, defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    // Upstream is a reading baseline with its own test suite; this repository never runs it.
    exclude: [...configDefaults.exclude, 'upstream/**'],
    // The fixture tests spawn the real `eslint` and `oxlint` binaries, and every worker loads the
    // Plugin Bundle once, so a first call costs a few seconds on a loaded machine.
    testTimeout: 30_000,
  },
})
