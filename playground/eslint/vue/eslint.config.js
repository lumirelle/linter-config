// @ts-check
import { eslint } from '@lumirelle/linter-config/eslint'

// An example consumer of `@lumirelle/linter-config/eslint`: the options are written where the
// factory is called, because a project that runs ESLint alone has no second config to share them
// with, and the package owns every rule, the accessibility ones included.
export default eslint({
  // A single-page application, not a library: the application-type slices stay on.
  type: 'app',
  // The accessibility sub-option, and the reason this example declares the
  // `eslint-plugin-vuejs-accessibility` peer: with `a11y: true` the Module adds the plugin to
  // `lumirelle/vue/setup` and 22 `vue-a11y/*` rules to `lumirelle/vue/rules`. The peer stays
  // declared in every flavor, this ESLint-only one included, because the check runs before an
  // Adapter filters on Domain.
  vue: { a11y: true },
  // The Module lints class ordering in templates and attributes.
  unocss: true,
  // Upstream reads the `test` Module inline and defaults it on. The example states it because a
  // Vite application is where a component suite lives; the snapshot ships no test file, because
  // `vitest` and `@vue/test-utils` are runtime dependencies it deliberately leaves out.
  test: true,
})
