// @ts-check
import { eslint } from '@lumirelle/linter-config/eslint'

// An example consumer of `@lumirelle/linter-config/eslint`: the options are written where the
// factory is called, because a project that runs ESLint alone has no second config to share them
// with, and the package owns every rule.
export default eslint({
  // An application, not a library: the library-specific slices of the `node`, `e18e` and
  // TypeScript Modules stay off.
  type: 'app',
  // The React Module, and the only one here whose peers the example itself has to install:
  // `@eslint-react/eslint-plugin` and `eslint-plugin-react-refresh`. They stay installed in this
  // ESLint-only flavor, where the Module composes for ESLint alone; the Oxlint flavor declares them
  // too, because the peer check runs before an Adapter filters on Domain.
  react: true,
  // Every source file in the tree is JSX or TSX, so the JSX Module's parser flag is declared too;
  // it adds one object and needs no plugin.
  jsx: true,
  // UnoCSS class ordering, through `@unocss/eslint-plugin`, which doubles as the Oxlint `jsPlugin`.
  unocss: true,
  // Upstream reads the `test` Module inline and defaults it on; the example states it because
  // `src/App.test.tsx` is part of the source tree.
  test: true,
})
