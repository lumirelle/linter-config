// @ts-check
import { oxlint } from '@lumirelle/linter-config/oxlint'

// The paired flavor's Source, emitted for Oxlint, from the options below: a project that runs
// Oxlint alone writes them where the factory is called. Oxlint discovers this file without a `-c`
// flag; do not keep an `.oxlintrc.json` beside it, because Oxlint refuses to load both.
export default oxlint({
  // An application, not a library: the library-specific slices of the `node`, `e18e` and
  // TypeScript Modules stay off.
  type: 'app',
  // The React Module, and the only one here whose peers the example itself has to install:
  // `@eslint-react/eslint-plugin` and `eslint-plugin-react-refresh`. This flavor ships no ESLint
  // config module and still declares them: Source asks for a Module's peer packages before an
  // Adapter filters on Domain, so the Oxlint side fails without them as loudly as the ESLint side.
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
