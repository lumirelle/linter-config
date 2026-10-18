import { configDefaults, defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    // Upstream is a reading baseline with its own test suite; this repository never runs it.
    // `test/fixtures/**` holds lint inputs, not tests: one of them is even named
    // `violations.test.js` and carries a `.only`, which vitest refuses in CI.
    // `playground/**` holds example consumers: their test files are lint targets for the `test`
    // Module, not part of this repository's suite.
    exclude: [...configDefaults.exclude, 'upstream/**', 'packages/config/test/fixtures/**', 'playground/**'],
    // The first Emission in a worker imports every bundled plugin; the Modules that lean on
    // `jsPlugins` make that import the slowest thing a unit test does, well past the default.
    testTimeout: 20_000,
  },
})
