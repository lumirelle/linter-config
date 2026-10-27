import type { Options } from '@lumirelle/linter-config/eslint'

/**
 * The example's own options, the one object both configs are built from.
 *
 * A Vite-style React single-page application. There is no starter to copy this from — the
 * predecessor is `antfu({ react: true, unocss: true })` plus a `.oxlintrc.json`, which `README.md`
 * maps field by field.
 */
export const options = {
  // An application, not a library: the library-specific slices of the `node`, `e18e` and
  // TypeScript Modules stay off.
  type: 'app',
  // The React Module, and the only one here whose peers the example itself has to install:
  // `@eslint-react/eslint-plugin` and `eslint-plugin-react-refresh`.
  react: true,
  // Every source file in the tree is JSX or TSX, so the JSX Module's parser flag is declared too;
  // it adds one object and needs no plugin.
  jsx: true,
  // UnoCSS class ordering, through `@unocss/eslint-plugin`, which doubles as the Oxlint `jsPlugin`.
  unocss: true,
  // Upstream reads the `test` Module inline and defaults it on; the example states it because
  // `src/App.test.tsx` is part of the source tree.
  test: true,
} satisfies Options
