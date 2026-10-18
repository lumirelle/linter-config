import type { ESLint, Linter } from 'eslint'
import tsPlugin from '@typescript-eslint/eslint-plugin'
import tsParser from '@typescript-eslint/parser'
import antfu from 'eslint-plugin-antfu'
import unusedImports from 'eslint-plugin-unused-imports'

/**
 * ESLint plugin objects, keyed by Plugin id.
 *
 * The keys are the registry's Plugin ids (`ts`, `vue`, `test`, ...), so the config
 * package can resolve a Plugin id to an object without knowing npm package names.
 * This bundle contains no rule semantics: it only forwards plugin objects.
 */
export const eslintPlugins: Record<string, ESLint.Plugin> = {
  'antfu': antfu as ESLint.Plugin,
  'ts': tsPlugin as unknown as ESLint.Plugin,
  'unused-imports': unusedImports as ESLint.Plugin,
}

/**
 * ESLint parser modules, keyed by the Plugin id that needs them.
 *
 * A parser is not a plugin, so it lives in its own map: the registry names a parser per
 * Plugin id (`ts` -> `@typescript-eslint/parser`), and the config package resolves the id
 * here instead of importing a parser package from Source.
 */
export const eslintParsers: Record<string, Linter.LanguageOptions['parser']> = {
  ts: tsParser as Linter.LanguageOptions['parser'],
}
