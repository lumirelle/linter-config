import type { Options } from '@lumirelle/linter-config/eslint'

/**
 * The example's own options, the one object the config is built from.
 *
 * This is the direct replacement for the starter's
 * `antfu({ unocss: true, toml: { ... } }, nuxt(), ...oxlint.buildFromOxlintConfigFile('.oxlintrc.json'))`
 * call; `../eslint-oxlint/nuxt/README.md` maps each field.
 *
 * The stack sets no `oxlint` entry, and this flavor could not act on one: without an Oxlint config
 * module there is no Bridge, so the Emission keeps every rule the stack turns on.
 */
export const options = {
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
} satisfies Options
