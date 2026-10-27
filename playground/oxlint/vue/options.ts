import type { Options } from '@lumirelle/linter-config/eslint'

/**
 * The example's own options, the one object the config is built from.
 *
 * `vue` has no starter counterpart, so `../eslint-oxlint/vue/README.md` shows the canonical previous
 * config this one replaces and maps it field by field.
 */
export const options = {
  // A single-page application, not a library: the application-type slices stay on.
  type: 'app',
  // The accessibility sub-option, and the reason this example declares the
  // `eslint-plugin-vuejs-accessibility` peer: with `a11y: true` the Module adds the plugin to
  // `lumirelle/vue/setup` and 22 `vue-a11y/*` rules to `lumirelle/vue/rules`. This flavor ships no
  // ESLint config module and still declares the peer: Source asks for a Module's peer packages
  // before the Oxlint Adapter filters on Domain, so Oxlint fails without it too.
  vue: { a11y: true },
  // The Module lints class ordering in templates and attributes.
  unocss: true,
  // Upstream reads the `test` Module inline and defaults it on. The example states it because a
  // Vite application is where a component suite lives; the snapshot ships no test file, because
  // `vitest` and `@vue/test-utils` are runtime dependencies it deliberately leaves out.
  test: true,
} satisfies Options
