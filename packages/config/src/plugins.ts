import type { PluginDefinition, PluginRef, RuleKey } from './types'

/**
 * Every Plugin id Source may reference, with where its ESLint plugin comes from
 * and how Oxlint realizes it.
 *
 * The id is the canonical rule prefix (`defaultPluginRenaming` in mind).
 */
const registry = {
  'angular': {
    from: 'peer',
    eslint: { plugin: '@angular-eslint/eslint-plugin' },
  },
  'angular-template': {
    from: 'peer',
    eslint: {
      plugin: '@angular-eslint/eslint-plugin-template',
      parser: '@angular-eslint/template-parser',
    },
  },
  'antfu': {
    from: 'bundle',
    eslint: { plugin: 'eslint-plugin-antfu' },
    oxlint: { jsPlugin: 'eslint-plugin-antfu', alias: 'antfu' },
  },
  'astro': {
    from: 'peer',
    eslint: { plugin: 'eslint-plugin-astro', parser: 'astro-eslint-parser' },
  },
  'command': {
    from: 'bundle',
    eslint: { plugin: 'eslint-plugin-command' },
    oxlint: { jsPlugin: 'eslint-plugin-command', alias: 'command' },
  },
  'e18e': {
    from: 'bundle',
    eslint: { plugin: '@e18e/eslint-plugin' },
    oxlint: { jsPlugin: '@e18e/eslint-plugin', alias: 'e18e' },
  },
  'erasable-syntax-only': {
    from: 'peer',
    eslint: { plugin: 'eslint-plugin-erasable-syntax-only' },
  },
  'eslint-comments': {
    from: 'bundle',
    eslint: { plugin: '@eslint-community/eslint-plugin-eslint-comments' },
    oxlint: {
      jsPlugin: '@eslint-community/eslint-plugin-eslint-comments',
      alias: 'eslint-comments',
    },
  },
  'format': {
    from: 'peer',
    eslint: { plugin: 'eslint-plugin-format' },
  },
  'import': {
    from: 'bundle',
    eslint: { plugin: 'eslint-plugin-import-lite' },
    oxlint: { builtin: 'import' },
  },
  'jsdoc': {
    from: 'bundle',
    eslint: { plugin: 'eslint-plugin-jsdoc' },
    oxlint: { builtin: 'jsdoc' },
  },
  'jsonc': {
    from: 'bundle',
    eslint: { plugin: 'eslint-plugin-jsonc' },
  },
  'jsx-a11y': {
    from: 'peer',
    eslint: { plugin: 'eslint-plugin-jsx-a11y' },
    oxlint: { builtin: 'jsx-a11y' },
  },
  'md': {
    from: 'bundle',
    eslint: { plugin: '@eslint/markdown' },
  },
  'next': {
    from: 'peer',
    eslint: { plugin: '@next/eslint-plugin-next' },
    oxlint: { builtin: 'nextjs' },
  },
  'node': {
    from: 'bundle',
    eslint: { plugin: 'eslint-plugin-n' },
    oxlint: { builtin: 'node' },
  },
  'perfectionist': {
    from: 'bundle',
    eslint: { plugin: 'eslint-plugin-perfectionist' },
    oxlint: { jsPlugin: 'eslint-plugin-perfectionist', alias: 'perfectionist' },
  },
  'pnpm': {
    from: 'bundle',
    eslint: { plugin: 'eslint-plugin-pnpm' },
  },
  'react': {
    from: 'peer',
    eslint: { plugin: '@eslint-react/eslint-plugin' },
    oxlint: { builtin: 'react' },
  },
  'react-refresh': {
    from: 'peer',
    eslint: { plugin: 'eslint-plugin-react-refresh' },
  },
  'regexp': {
    from: 'bundle',
    eslint: { plugin: 'eslint-plugin-regexp' },
    oxlint: { jsPlugin: 'eslint-plugin-regexp', alias: 'regexp' },
  },
  'slop': {
    from: 'peer',
    eslint: { plugin: 'eslint-plugin-slop' },
    oxlint: { jsPlugin: 'eslint-plugin-slop', alias: 'slop' },
  },
  'solid': {
    from: 'peer',
    eslint: { plugin: 'eslint-plugin-solid' },
    oxlint: { jsPlugin: 'eslint-plugin-solid', alias: 'solid' },
  },
  'sonar': {
    from: 'peer',
    eslint: { plugin: 'eslint-plugin-sonarjs' },
    oxlint: { jsPlugin: 'eslint-plugin-sonarjs', alias: 'sonar' },
  },
  'style': {
    from: 'peer',
    eslint: { plugin: '@stylistic/eslint-plugin' },
    oxlint: { jsPlugin: '@stylistic/eslint-plugin', alias: 'style' },
  },
  'svelte': {
    from: 'peer',
    eslint: { plugin: 'eslint-plugin-svelte', parser: 'svelte-eslint-parser' },
  },
  'test': {
    from: 'bundle',
    eslint: { plugin: '@vitest/eslint-plugin' },
    oxlint: { builtin: 'vitest' },
  },
  'toml': {
    from: 'bundle',
    eslint: { plugin: 'eslint-plugin-toml', parser: 'toml-eslint-parser' },
  },
  'ts': {
    from: 'bundle',
    eslint: { plugin: '@typescript-eslint/eslint-plugin', parser: '@typescript-eslint/parser' },
    oxlint: { builtin: 'typescript' },
  },
  'unicorn': {
    from: 'bundle',
    eslint: { plugin: 'eslint-plugin-unicorn' },
    oxlint: { builtin: 'unicorn' },
  },
  'unocss': {
    from: 'peer',
    eslint: { plugin: '@unocss/eslint-plugin' },
    oxlint: { jsPlugin: '@unocss/eslint-plugin', alias: 'unocss' },
  },
  'unused-imports': {
    from: 'bundle',
    eslint: { plugin: 'eslint-plugin-unused-imports' },
    oxlint: { jsPlugin: 'eslint-plugin-unused-imports', alias: 'unused-imports' },
  },
  'vue': {
    from: 'bundle',
    eslint: {
      plugin: 'eslint-plugin-vue',
      parser: 'vue-eslint-parser',
      processor: 'eslint-processor-vue-blocks',
    },
    oxlint: { builtin: 'vue' },
  },
  'vue-a11y': {
    from: 'peer',
    eslint: { plugin: 'eslint-plugin-vuejs-accessibility' },
  },
  'yaml': {
    from: 'bundle',
    eslint: { plugin: 'eslint-plugin-yml', parser: 'yaml-eslint-parser' },
  },
} as const satisfies Record<string, PluginDefinition>

/** Every registered Plugin id; derived from the registry, never hand-duplicated. */
export type PluginId = keyof typeof registry

/** Every registered Plugin id, as data. */
export const PLUGIN_IDS: readonly PluginId[] = Object.keys(registry) as PluginId[]

/** The registry entry for a Plugin id. */
export function pluginDefinition(id: PluginId): PluginDefinition {
  return registry[id]
}

/** Narrows a string to a registered Plugin id. */
export function isPluginId(value: string): value is PluginId {
  return Object.hasOwn(registry, value)
}

/**
 * The Plugin id a rule key is prefixed with, matched against the longest registered id
 * so a longer id (`angular-template`) wins over a shorter one that prefixes it (`angular`).
 */
export function pluginIdOfRuleKey(key: RuleKey): PluginId | undefined {
  return [...PLUGIN_IDS].sort((a, b) => b.length - a.length).find(id => key.startsWith(`${id}/`))
}

/**
 * Brands a Plugin id for use in `ConfigObject.plugins`; the runtime value is the id,
 * so the Adapters read the id straight out of the reference.
 */
export function pluginRef(id: PluginId): PluginRef {
  return id as PluginRef
}
