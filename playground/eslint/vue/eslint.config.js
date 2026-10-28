// @ts-check
import { eslint } from '@lumirelle/linter-config/eslint'

// An example consumer of `@lumirelle/linter-config/eslint`.
export default eslint({
  // An application, not a library: so the library-specific slices of the `node`, `e18e` and
  // TypeScript Modules are disabled.
  type: 'app',
  // The Vue module with the accessibility sub-option, require `eslint-plugin-vuejs-accessibility`.
  vue: { a11y: true },
  // The UnoCSS Module: require `@unocss/eslint-plugin`, declared as peers.
  unocss: true,
})
