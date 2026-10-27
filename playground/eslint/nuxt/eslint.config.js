// @ts-check
import { eslint } from '@lumirelle/linter-config/eslint'

// An example consumer of `@lumirelle/linter-config/eslint`: the options are written where the
// factory is called, because a project that runs ESLint alone has no second config to share them
// with, and the package owns every rule, including the ones the starter used to get from the
// generated Nuxt ESLint config. The example does not set `oxlint: true`, so this Emission carries
// no Bridge; the `ts` example shows that option.
export default eslint({
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
