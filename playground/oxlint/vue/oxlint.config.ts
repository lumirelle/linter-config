// @ts-check
import { oxlint } from '@lumirelle/linter-config/oxlint'

// An example consumer of `@lumirelle/linter-config/oxlint`.
export default oxlint({
  // An application, not a library: so the library-specific slices of the `node`, `e18e` and
  // TypeScript Modules are disabled.
  type: 'app',
  // The Vue module with the accessibility sub-option, require `eslint-plugin-vuejs-accessibility`.
  vue: { a11y: true },
  // The UnoCSS Module: require `@unocss/eslint-plugin`, declared as peers.
  unocss: true,
})
