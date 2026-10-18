import type { ESLint } from 'eslint'
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
  'unused-imports': unusedImports as ESLint.Plugin,
}
