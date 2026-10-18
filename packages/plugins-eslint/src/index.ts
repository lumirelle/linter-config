import type { ESLint, Linter } from 'eslint'
import e18e from '@e18e/eslint-plugin'
import eslintComments from '@eslint-community/eslint-plugin-eslint-comments'
import markdown from '@eslint/markdown'
import stylistic from '@stylistic/eslint-plugin'
import tsPlugin from '@typescript-eslint/eslint-plugin'
import tsParser from '@typescript-eslint/parser'
import vitestPlugin from '@vitest/eslint-plugin'
import { mergeProcessors } from 'eslint-merge-processors'
import antfu from 'eslint-plugin-antfu'
import command from 'eslint-plugin-command'
import importLite from 'eslint-plugin-import-lite'
import jsdoc from 'eslint-plugin-jsdoc'
import jsonc from 'eslint-plugin-jsonc'
import node from 'eslint-plugin-n'
// @ts-expect-error -- the package ships no type declarations.
import noOnlyTestsModule from 'eslint-plugin-no-only-tests'
import perfectionist from 'eslint-plugin-perfectionist'
import pnpm from 'eslint-plugin-pnpm'
import regexp from 'eslint-plugin-regexp'
import toml from 'eslint-plugin-toml'
import unicorn from 'eslint-plugin-unicorn'
import unusedImports from 'eslint-plugin-unused-imports'
import vuePlugin from 'eslint-plugin-vue'
import yaml from 'eslint-plugin-yml'
import processorVueBlocks from 'eslint-processor-vue-blocks'
import * as tomlParser from 'toml-eslint-parser'
import vueParser from 'vue-eslint-parser'
import * as yamlParser from 'yaml-eslint-parser'

type Processor = Extract<Linter.Config['processor'], object>

/** `eslint-plugin-no-only-tests` ships no declarations, so its shape is named once, here. */
const noOnlyTests = noOnlyTestsModule as { rules: NonNullable<ESLint.Plugin['rules']> }

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
}

/**
 * ESLint plugin objects, keyed by Plugin id.
 *
 * The keys are the registry's Plugin ids (`ts`, `vue`, `test`, ...), so the config
 * package can resolve a Plugin id to an object without knowing npm package names.
 * This bundle contains no rule semantics: it only forwards plugin objects.
 */
export const eslintPlugins: Record<string, ESLint.Plugin> = {
  'antfu': antfu,
  'command': command,
  'e18e': e18e,
  'eslint-comments': eslintComments,
  'import': importLite,
  'jsdoc': jsdoc,
  'jsonc': jsonc,
  'md': markdown,
  'node': node,
  'perfectionist': perfectionist,
  'pnpm': pnpm,
  'regexp': regexp,
  'style': stylistic,
  'test': testPlugin,
  'toml': toml,
  'ts': tsPlugin as unknown as ESLint.Plugin,
  'unicorn': unicorn,
  'unused-imports': unusedImports,
  'vue': vuePlugin,
  'yaml': yaml,
}

/**
 * ESLint parser modules, keyed by the Plugin id that needs them.
 *
 * A parser is not a plugin, so it lives in its own map: the registry names a parser per
 * Plugin id (`ts` -> `@typescript-eslint/parser`), and the config package resolves the id
 * here instead of importing a parser package from Source.
 */
export const eslintParsers: Record<string, Linter.LanguageOptions['parser']> = {
  toml: tomlParser,
  ts: tsParser,
  vue: vueParser,
  yaml: yamlParser,
}

/**
 * Processor glue, keyed `"<Plugin id>/<processor name>"`, for the processors a plugin does not
 * register itself.
 *
 * Vue's `.vue` processor lives on `eslint-plugin-vue`, but the SFC block handling Upstream turns
 * on by default is `eslint-processor-vue-blocks`' own processor merged in front of it. Building it
 * here keeps the composition in the package that already loads both, so the config package names
 * it as data and never imports either.
 */
export const eslintProcessors: Record<string, (options?: Record<string, unknown>) => Linter.Config['processor']> = {
  'vue/vue-blocks': (options) => {
    const { processors } = vuePlugin as unknown as { processors: Record<string, Processor> }
    return mergeProcessors([processors['.vue']!, processorVueBlocks(options ?? {})])
  },
}
