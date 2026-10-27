// @ts-check
import { oxlint } from '@lumirelle/linter-config/oxlint'

// The Oxlint Emission of the options below, which a project that runs Oxlint alone writes where
// the factory is called: there is no second config to share them with. Oxlint discovers this file
// without a `-c` flag; do not keep an `.oxlintrc.json` beside it, because Oxlint refuses to load
// both.
export default oxlint({
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
