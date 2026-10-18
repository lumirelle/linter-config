import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { eslintPlugins } from '@lumirelle/linter-plugins-eslint'
import { builtinPlugins, jsPlugins } from '@lumirelle/linter-plugins-oxlint'
import { describe, expect, it } from 'vitest'
import { isPluginId } from '../src/plugins'

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
    expect(Object.keys(eslintPlugins).sort()).toEqual(['antfu', 'unused-imports'])
    for (const plugin of Object.values(eslintPlugins)) {
      expect(plugin.rules).toBeTypeOf('object')
    }
    expect(jsPlugins).toEqual({})
    expect(builtinPlugins).toEqual([])
  })

  it('keys every entry by a registered Plugin id', () => {
    const unregistered = [...Object.keys(eslintPlugins), ...Object.keys(jsPlugins)].filter(id => !isPluginId(id))

    expect(unregistered).toEqual([])
  })
})
