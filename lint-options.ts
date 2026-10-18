// @ts-check
import type { Options } from '@lumirelle/linter-config/eslint'

/**
 * The repository's own options, the one object both configs are built from.
 *
 * Running both tools over this repository is only worth anything if they agree on what Source
 * emits: options passed to one side and not the other make the Emissions diverge, and the Bridge
 * then turns off rules Oxlint never enabled. `test/repo-config.test.ts` is the guard.
 */
export const options = {
  // A library, not an application: the `node` and `jsdoc` Modules stay on, while Upstream's
  // application-only defaults stay off.
  type: 'lib',
  // Type-aware rules need the project's TypeScript config, on both sides: Oxlint reads them in its
  // own type-aware mode, which is what makes the `oxlint` object below more than a Bridge flag.
  typescript: { tsconfigPath: 'tsconfig.json' },
  oxlint: { typeAware: true, typeCheck: true },
  ignores: [
    // Test fixtures deliberately break house rules to prove that the emitted config reports them.
    'packages/config/test/fixtures/**',
    // The Upstream submodule is a reading baseline, not part of this workspace.
    'upstream/antfu-eslint-config/**',
  ],
  overrides: {
    // Two type-aware rules do not describe this repository, and turning them off here — in Source,
    // so both Emissions agree — is the documented exception rather than a silent drift.
    'lumirelle/typescript/rules-type-aware': {
      rules: {
        // The factories return thenable Composers, not Promises, by design (ADR 0001); making
        // `eslint()` / `oxlint()` async would change that public shape.
        'ts/promise-function-async': 'off',
        // `!nullableString` is used as the "absent" test throughout Source, where an empty string
        // cannot occur; spelling out the nullability is a separate, behaviour-touching refactor.
        'ts/strict-boolean-expressions': 'off',
      },
    },
  },
} satisfies Options
