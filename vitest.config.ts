import { configDefaults, defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    // Upstream is a reading baseline with its own test suite; this repository never runs it.
    exclude: [...configDefaults.exclude, 'upstream/**'],
  },
})
