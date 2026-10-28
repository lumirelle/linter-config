import { existsSync, readFileSync } from 'node:fs'
import { isAbsolute } from 'node:path'
import { fileURLToPath } from 'node:url'
import { eslintParsers, eslintPlugins, eslintProcessors } from '@lumirelle/linter-plugins-eslint'
import { builtinPlugins, jsPlugins, resolveJsPlugin } from '@lumirelle/linter-plugins-oxlint'
import { describe, expect, it } from 'vitest'
import { blacklistEntry } from '../src/oxlint/blacklist'
import { isPluginId, PLUGIN_IDS, pluginDefinition } from '../src/plugins'

const packageJson = JSON.parse(
  readFileSync(fileURLToPath(new URL('../package.json', import.meta.url)), 'utf8'),
) as {
  peerDependencies: Record<string, string>
  peerDependenciesMeta: Record<string, { optional?: boolean }>
}

const BUNDLES = ['@lumirelle/linter-plugins-eslint', '@lumirelle/linter-plugins-oxlint']

/** One jsPlugin package the Oxlint Bundle is responsible for shipping. */
interface ShippedJsPlugin {
  id: string
  packageName: string
}

/**
 * The jsPlugin packages the Oxlint Bundle must ship: every Bundle-sourced id that Oxlint is allowed
 * to load. A blacklisted id keeps its `jsPlugins` entry but is not shipped, because the Emission
 * never asks Oxlint to load it.
 */
const SHIPPED: ShippedJsPlugin[] = PLUGIN_IDS.flatMap((id) => {
  const { from, oxlint } = pluginDefinition(id)
  if (from !== 'bundle' || blacklistEntry(id) || !oxlint || !('jsPlugin' in oxlint) || !oxlint.jsPlugin) {
    return []
  }
  return [{ id, packageName: oxlint.jsPlugin }]
})

/** The dependencies a workspace package declares. */
function dependenciesOf(url: URL): Record<string, string> {
  const manifest = JSON.parse(readFileSync(fileURLToPath(url), 'utf8')) as { dependencies?: Record<string, string> }
  return manifest.dependencies ?? {}
}

const OXLINT_BUNDLE_DEPENDENCIES = dependenciesOf(new URL('../../plugins-oxlint/package.json', import.meta.url))
const ESLINT_BUNDLE_DEPENDENCIES = dependenciesOf(new URL('../../plugins-eslint/package.json', import.meta.url))

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

  it('depends on exactly the jsPlugin packages it is meant to ship', () => {
    expect(Object.keys(OXLINT_BUNDLE_DEPENDENCIES).sort()).toEqual(SHIPPED.map(entry => entry.packageName).sort())
  })

  it('pins the jsPlugin packages at the catalog entry the ESLint Bundle uses', () => {
    for (const { packageName } of SHIPPED) {
      expect(OXLINT_BUNDLE_DEPENDENCIES[packageName], `${packageName} in the Oxlint Bundle`).toBeDefined()
      expect(OXLINT_BUNDLE_DEPENDENCIES[packageName], `${packageName} in the Oxlint Bundle`).toBe(ESLINT_BUNDLE_DEPENDENCIES[packageName])
    }
  })

  it('resolves every jsPlugin package it ships from its own module graph', () => {
    for (const { id, packageName } of SHIPPED) {
      const resolved = resolveJsPlugin(id)

      expect(resolved, `the Oxlint Bundle should resolve "${id}" (${packageName})`).toBeTypeOf('string')
      expect(isAbsolute(resolved as string), `${resolved} is an absolute path`).toBe(true)
      expect(existsSync(resolved as string), `${resolved} exists on disk`).toBe(true)
    }
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
