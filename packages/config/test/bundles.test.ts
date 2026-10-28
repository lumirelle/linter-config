import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { eslintParsers, eslintPlugins, eslintProcessors } from '@lumirelle/linter-plugins-eslint'
import { builtinPlugins, jsPlugins } from '@lumirelle/linter-plugins-oxlint'
import { describe, expect, it } from 'vitest'
import { isPluginId, PLUGIN_IDS, pluginDefinition } from '../src/plugins'

const packageJson = JSON.parse(
  readFileSync(fileURLToPath(new URL('../package.json', import.meta.url)), 'utf8'),
) as {
  peerDependencies: Record<string, string>
  peerDependenciesMeta: Record<string, { optional?: boolean }>
}

const BUNDLES = ['@lumirelle/linter-plugins-eslint', '@lumirelle/linter-plugins-oxlint']

describe('plugin bundles', () => {
  it('are optional peers of the config package', () => {
    for (const bundle of BUNDLES) {
      expect(packageJson.peerDependencies).toHaveProperty(bundle)
      expect(packageJson.peerDependenciesMeta[bundle]?.optional).toBe(true)
    }
  })

  it('carry no rule semantics of their own, only forwarded plugin objects', () => {
    expect(Object.keys(eslintPlugins).sort()).toEqual([
      'antfu',
      'command',
      'e18e',
      'eslint-comments',
      'import',
      'jsdoc',
      'jsonc',
      'md',
      'node',
      'perfectionist',
      'pnpm',
      'regexp',
      'test',
      'toml',
      'ts',
      'unicorn',
      'unused-imports',
      'vue',
      'yaml',
    ])
    for (const plugin of Object.values(eslintPlugins)) {
      expect(plugin.rules).toBeTypeOf('object')
    }
  })

  it('carry the Oxlint specifiers the registry declares, and nothing else', () => {
    const builtin = PLUGIN_IDS.flatMap((id) => {
      const oxlint = pluginDefinition(id).oxlint
      return oxlint && 'builtin' in oxlint && oxlint.builtin ? [oxlint.builtin] : []
    })
    const specifiers = Object.fromEntries(PLUGIN_IDS.flatMap((id) => {
      const oxlint = pluginDefinition(id).oxlint
      return oxlint && 'jsPlugin' in oxlint && oxlint.jsPlugin ? [[id, oxlint.jsPlugin]] : []
    }))

    expect([...builtinPlugins].sort()).toEqual([...builtin].sort())
    expect(jsPlugins).toEqual(specifiers)
  })

  it('composes the merged test plugin', () => {
    const rules = eslintPlugins.test?.rules ?? {}
    expect(Object.keys(rules)).toEqual(expect.arrayContaining(['no-only-tests', 'consistent-test-it']))
  })

  it('forward the parser a Plugin id registers, separately from its plugin', () => {
    expect(Object.keys(eslintParsers).sort()).toEqual(['toml', 'ts', 'vue', 'yaml'])
    expect(eslintParsers.ts).toMatchObject({ meta: { name: 'typescript-eslint/parser' } })
    expect(eslintParsers.vue).toMatchObject({ meta: { name: 'vue-eslint-parser' } })
  })

  it('forward the processor glue a Plugin id needs, keyed by id and name', () => {
    expect(Object.keys(eslintProcessors)).toEqual(['vue/vue-blocks'])
  })

  it('keys every entry by a registered Plugin id', () => {
    const unregistered = [
      ...Object.keys(eslintPlugins),
      ...Object.keys(eslintParsers),
      ...Object.keys(jsPlugins),
      ...Object.keys(eslintProcessors).map(key => key.split('/')[0]!),
    ].filter(id => !isPluginId(id))

    expect(unregistered).toEqual([])
  })
})
