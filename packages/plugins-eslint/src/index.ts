import type { ESLint, Linter } from 'eslint'
import markdown from '@eslint/markdown'
import stylistic from '@stylistic/eslint-plugin'
import tsPlugin from '@typescript-eslint/eslint-plugin'
import tsParser from '@typescript-eslint/parser'
import vitestPlugin from '@vitest/eslint-plugin'
import antfu from 'eslint-plugin-antfu'
import importLite from 'eslint-plugin-import-lite'
import jsdoc from 'eslint-plugin-jsdoc'
import jsonc from 'eslint-plugin-jsonc'
import node from 'eslint-plugin-n'
// @ts-expect-error -- the package ships no type declarations.
import noOnlyTests from 'eslint-plugin-no-only-tests'
import pnpm from 'eslint-plugin-pnpm'
import toml from 'eslint-plugin-toml'
import unicorn from 'eslint-plugin-unicorn'
import unusedImports from 'eslint-plugin-unused-imports'
import yaml from 'eslint-plugin-yml'
import * as tomlParser from 'toml-eslint-parser'
import * as yamlParser from 'yaml-eslint-parser'

/**
 * The plugin Upstream calls `test`: `@vitest/eslint-plugin` with `eslint-plugin-no-only-tests`
 * rules merged on top, because the `test` rule prefix spans both packages.
 *
 * It is composed once here rather than per call, so every Config object that declares the `test`
 * plugin gets the same object.
 */
const testPlugin: ESLint.Plugin = {
  ...vitestPlugin,
  rules: {
    ...vitestPlugin.rules,
    ...noOnlyTests.rules,
  },
} as unknown as ESLint.Plugin

/**
 * ESLint plugin objects, keyed by Plugin id.
 *
 * The keys are the registry's Plugin ids (`ts`, `vue`, `test`, ...), so the config
 * package can resolve a Plugin id to an object without knowing npm package names.
 * This bundle contains no rule semantics: it only forwards plugin objects.
 */
export const eslintPlugins: Record<string, ESLint.Plugin> = {
  'antfu': antfu as ESLint.Plugin,
  'import': importLite as ESLint.Plugin,
  'jsdoc': jsdoc as unknown as ESLint.Plugin,
  'jsonc': jsonc as unknown as ESLint.Plugin,
  'md': markdown as unknown as ESLint.Plugin,
  'node': node as unknown as ESLint.Plugin,
  'pnpm': pnpm as unknown as ESLint.Plugin,
  'style': stylistic as unknown as ESLint.Plugin,
  'test': testPlugin,
  'toml': toml as unknown as ESLint.Plugin,
  'ts': tsPlugin as unknown as ESLint.Plugin,
  'unicorn': unicorn as unknown as ESLint.Plugin,
  'unused-imports': unusedImports as ESLint.Plugin,
  'yaml': yaml as unknown as ESLint.Plugin,
}

/**
 * ESLint parser modules, keyed by the Plugin id that needs them.
 *
 * A parser is not a plugin, so it lives in its own map: the registry names a parser per
 * Plugin id (`ts` -> `@typescript-eslint/parser`), and the config package resolves the id
 * here instead of importing a parser package from Source.
 */
export const eslintParsers: Record<string, Linter.LanguageOptions['parser']> = {
  toml: tomlParser as unknown as Linter.LanguageOptions['parser'],
  ts: tsParser as Linter.LanguageOptions['parser'],
  yaml: yamlParser as unknown as Linter.LanguageOptions['parser'],
}
