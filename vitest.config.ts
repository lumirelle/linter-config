import { configDefaults, defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    // Upstream is a reading baseline with its own test suite; this repository never runs it.
    exclude: [...configDefaults.exclude, 'upstream/**'],
    // The first Emission in a worker imports every bundled plugin; the Modules that lean on
    // `jsPlugins` make that import the slowest thing a unit test does, well past the default.
    testTimeout: 20_000,
  },
})
