import type { Options } from '@lumirelle/linter-config/eslint'

/**
 * The workspace's own options, the one object every package is linted from.
 *
 * This is the direct replacement for the monorepo starter's root `antfu(...)` call plus its
 * `.oxlintrc.json`; `README.md` maps each field, and `overrides` is where a single package's
 * deviation goes instead of a second config file.
 */
export const options = {
  // A library, not an application: the library-specific slices of the `node`, `e18e` and
  // TypeScript Modules stay on for every package.
  type: 'lib',
  // Type-aware rules need the workspace's TypeScript config, on both sides: Oxlint reads them in
  // its own type-aware mode, which is what makes the `oxlint` object below more than a Bridge flag.
  typescript: { tsconfigPath: 'tsconfig.json' },
  oxlint: { typeAware: true },
  // The `packages/core` sources include a test file, and the root config lints it.
  test: true,
  overrides: {
    // A Config object name targets exactly that object, so one package's deviation never forks the
    // config. `files` replaces that object's scope, which is how the type-aware rules — the slowest
    // part of the Emission — are narrowed to the one package that publishes types; the setup and
    // parser objects keep their own scope, so every package still parses with the project service.
    // The scope names TypeScript sources: a package directory also holds its `package.json`, and a
    // rule that needs type information cannot run on a file no parser project covers.
    'lumirelle/typescript/rules-type-aware': {
      files: ['packages/core/**/*.ts'],
      rules: {
        // `packages/core` is the boundary that reads untrusted payloads, where the untyped value
        // cannot be avoided; every other type-aware rule stays on.
        'ts/no-unsafe-assignment': 'off',
      },
    },
  },
} satisfies Options
