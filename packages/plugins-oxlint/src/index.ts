import type { OxlintConfig } from 'oxlint'

/** One of Oxlint's built-in plugins, as accepted by its `plugins` field. */
export type BuiltinPlugin = NonNullable<OxlintConfig['plugins']>[number]

/**
 * Built-in Oxlint plugins this configuration may enable.
 *
 * Oxlint ships these itself, so they need no package from this bundle. The names are Oxlint's own
 * scope names (`vitest`, not `test`), which is also how the rules read: `vitest/no-disabled-tests`.
 */
export const builtinPlugins: readonly BuiltinPlugin[] = [
  'import',
  'jsdoc',
  'jsx-a11y',
  'nextjs',
  'node',
  'react',
  'typescript',
  'unicorn',
  'vitest',
  'vue',
]

/**
 * ESLint plugins loaded through Oxlint's `jsPlugins`, keyed by Plugin id; the value is
 * the specifier Oxlint resolves. The alias Oxlint sees is the key itself, so supported
 * rule keys are identical in ESLint and Oxlint.
 */
export const jsPlugins: Readonly<Record<string, string>> = {
  'antfu': 'eslint-plugin-antfu',
  'command': 'eslint-plugin-command',
  'e18e': '@e18e/eslint-plugin',
  'eslint-comments': '@eslint-community/eslint-plugin-eslint-comments',
  'perfectionist': 'eslint-plugin-perfectionist',
  'regexp': 'eslint-plugin-regexp',
  'slop': 'eslint-plugin-slop',
  'solid': 'eslint-plugin-solid',
  'sonar': 'eslint-plugin-sonarjs',
  'style': '@stylistic/eslint-plugin',
  'unocss': '@unocss/eslint-plugin',
  'unused-imports': 'eslint-plugin-unused-imports',
}
