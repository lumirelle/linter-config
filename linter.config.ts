import type { Options } from '@lumirelle/linter-config'

/**
 * Linter options for both ESLint & Oxlint.
 */
export const options = {
  type: 'lib',
  typescript: { tsconfigPath: 'tsconfig.json' },
  oxlint: { typeAware: true, typeCheck: true },
  ignores: [
    'packages/config/test/fixtures/**',
    'upstream/antfu-eslint-config/**',
    'playground/*/*/src/**',
    'playground/*/*/app/**',
    'playground/*/*/packages/*/src/**',
    'playground/*/*/nuxt.config.ts',
  ],
  overrides: {
    'lumirelle/typescript/rules-type-aware': {
      rules: {
        'ts/promise-function-async': 'off',
        'ts/strict-boolean-expressions': 'off',
      },
    },
  },
} satisfies Options
