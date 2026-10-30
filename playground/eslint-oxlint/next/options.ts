import type { Options } from '@lumirelle/linter-config'

/**
 * The example's own options, the one object both configs are built from.
 */
export const options = {
  // An application, not a library: the library-specific slices of the `node`, `e18e` and
  // TypeScript Modules are disabled.
  type: 'app',
  // The React Module: require `@eslint-react/eslint-plugin` & `eslint-plugin-react-refresh`, both declared as peers.
  react: true,
  // The Next Module: require `@next/eslint-plugin-next`, declared as peers.
  nextjs: true,
} satisfies Options
