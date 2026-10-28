// @ts-check
import { eslint } from '@lumirelle/linter-config/eslint'

// An example consumer of `@lumirelle/linter-config/eslint`.
export default eslint({
  // An application, not a library: so the library-specific slices of the `node`, `e18e` and
  // TypeScript Modules are disabled.
  type: 'app',
  // The React Module: require `@eslint-react/eslint-plugin` & `eslint-plugin-react-refresh`, both declared as peers.
  react: true,
  // The Next Module: require `@next/eslint-plugin-next`, declared as peers.
  nextjs: true,
})
