import type { Options } from '@lumirelle/linter-config/eslint'

/**
 * The example's own options, the one object the config is built from.
 *
 * A Next.js App Router project. There is no starter to copy this from — `create-next-app` writes
 * `eslint-config-next` into the project, and `../eslint-oxlint/next/README.md` explains why that
 * config is not composed here and how to add its rules back through `overrides`.
 *
 * The stack sets no `oxlint` entry, and this flavor could not act on one: without an Oxlint config
 * module there is no Bridge, so the Emission keeps every rule the stack turns on.
 */
export const options = {
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
} satisfies Options
