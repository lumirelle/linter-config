// @ts-check
import { oxlint } from '@lumirelle/linter-config/oxlint'

// The Oxlint Emission of the options below, which a project that runs Oxlint alone writes where
// the factory is called: there is no second config to share them with. Oxlint discovers this file
// without a `-c` flag; do not keep an `.oxlintrc.json` beside it, because Oxlint refuses to load
// both.
export default oxlint({
  // A Nuxt application, not a library: the application-type slices stay on.
  type: 'app',
  // `nuxt()` brought Vue support in through the generated `./.nuxt/eslint.config.mjs`; that file is
  // deliberately not composed here, so the Vue Module is where the Vue rules come from now.
  vue: true,
  // The starter's `unocss: true`; the Module lints class ordering in templates and attributes.
  unocss: true,
  // Upstream reads the `test` Module inline and defaults it on. The starter decides it explicitly
  // because its `@nuxt/test-utils` suite is part of the project; this snapshot ships no test file.
  test: true,
})
