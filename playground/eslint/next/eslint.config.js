// @ts-check
import { eslint } from '@lumirelle/linter-config/eslint'

// An example consumer of `@lumirelle/linter-config/eslint`: the options are written where the
// factory is called, because a project that runs ESLint alone has no second config to share them
// with, and the package owns every rule.
export default eslint({
  // An application, not a library: the library-specific slices of the `node`, `e18e` and
  // TypeScript Modules stay off.
  type: 'app',
  // The React Module, shared with the `react` example: `@eslint-react/eslint-plugin` plus
  // `eslint-plugin-react-refresh`, both declared as peers.
  react: true,
  // The Next Module: `@next/eslint-plugin-next`'s `recommended` and `core-web-vitals` rule sets.
  nextjs: true,
  // Upstream reads the `test` Module inline and defaults it on; the example states it because
  // `app/page.test.tsx` is part of the source tree.
  test: true,
})
