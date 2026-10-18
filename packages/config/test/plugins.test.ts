import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { isPluginId, PLUGIN_IDS, pluginDefinition, pluginIdOfRuleKey, pluginRef } from '../src/plugins'

const oxlintSchema = JSON.parse(
  readFileSync(join(dirname(createRequire(import.meta.url).resolve('oxlint/package.json')), 'configuration_schema.json'), 'utf8'),
) as { definitions: Record<string, { enum?: string[] }> }

/** Oxlint owns these JavaScript plugin names, so a `jsPlugins` alias may not use them. */
const OXLINT_RESERVED_SCOPES = oxlintSchema.definitions.LintPluginOptionsSchema?.enum ?? []

const designDoc = readFileSync(
  fileURLToPath(new URL('../../../docs/design/source-schema.md', import.meta.url)),
  'utf8',
)

/** Ids the porting map requires, whatever the design doc's illustrative union happens to say. */
const REQUIRED_PLUGIN_IDS = [
  'ts',
  'test',
  'import',
  'node',
  'unicorn',
  'jsdoc',
  'vue',
  'react',
  'next',
  'jsx-a11y',
  'style',
  'perfectionist',
  'regexp',
  'e18e',
  'antfu',
  'command',
  'eslint-comments',
  'unused-imports',
  'sonar',
  'slop',
  'unocss',
  'solid',
  'astro',
  'svelte',
  'angular',
  'angular-template',
  'jsonc',
  'yaml',
  'toml',
  'md',
  'pnpm',
  'format',
]

/** The design doc's union is illustrative; these are the ids we spell differently on purpose. */
const DESIGN_DOC_RENAMES: Record<string, string> = {
  '@angular-eslint': 'angular',
}

function designDocPluginIds(): string[] {
  const declaration = /type PluginId\s*=([\s\S]*?)\n\n/.exec(designDoc)?.[1]
  if (!declaration) {
    throw new Error('docs/design/source-schema.md no longer declares `type PluginId`')
  }
  return [...declaration.matchAll(/'([^']+)'/g)].map(match => DESIGN_DOC_RENAMES[match[1]!] ?? match[1]!)
}

describe('plugin id registry', () => {
  it('registers every Plugin id the porting map requires', () => {
    expect(REQUIRED_PLUGIN_IDS.filter(id => !isPluginId(id))).toEqual([])
  })

  it('registers every design-doc Plugin id', () => {
    const documented = designDocPluginIds()

    expect(documented.length).toBeGreaterThan(0)
    expect(documented.filter(id => !isPluginId(id))).toEqual([])
  })

  it('has unique ids', () => {
    expect(new Set(PLUGIN_IDS).size).toBe(PLUGIN_IDS.length)
  })

  it.each(PLUGIN_IDS)('defines %s with an ESLint plugin package', (id) => {
    const definition = pluginDefinition(id)

    expect(['bundle', 'peer']).toContain(definition.from)
    expect(definition.eslint.plugin).toMatch(/\S/)
  })

  it('records every Oxlint realization as a built-in scope or a jsPlugin alias', () => {
    for (const id of PLUGIN_IDS) {
      const oxlint = pluginDefinition(id).oxlint
      if (!oxlint) {
        continue
      }

      expect(oxlint.builtin ?? oxlint.jsPlugin).toBeDefined()
      if (oxlint.jsPlugin) {
        expect(oxlint.alias).toBe(id)
        expect(OXLINT_RESERVED_SCOPES).not.toContain(oxlint.alias)
      }
    }
  })

  it('only claims built-in scopes that Oxlint really ships', () => {
    for (const id of PLUGIN_IDS) {
      const builtin = pluginDefinition(id).oxlint?.builtin
      if (builtin) {
        expect(OXLINT_RESERVED_SCOPES).toContain(builtin)
      }
    }
  })

  it('rejects unknown ids', () => {
    expect(isPluginId('ts')).toBe(true)
    expect(isPluginId('not-a-plugin')).toBe(false)
  })

  it('keeps plugin refs equal to their id', () => {
    for (const id of PLUGIN_IDS) {
      expect(pluginRef(id)).toBe(id)
    }
  })

  it('splits scoped rule keys on the longest registered id', () => {
    expect(pluginIdOfRuleKey('ts/no-explicit-any')).toBe('ts')
    expect(pluginIdOfRuleKey('angular-template/eqeqeq')).toBe('angular-template')
    expect(pluginIdOfRuleKey('no-console')).toBeUndefined()
  })
})
