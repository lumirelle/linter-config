import type { OxlintConfig } from 'oxlint'
import { existsSync, readFileSync } from 'node:fs'
import { isAbsolute } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { oxlint } from '../src/oxlint'
import { isPluginId, pluginDefinition } from '../src/plugins'
import { jsPluginDeclarations } from './helpers/emission'
import { expectJsPluginFires } from './helpers/oxlint-jsplugin'

const STYLISTIC_FIXTURES = fileURLToPath(new URL('./fixtures/stylistic/', import.meta.url))

type OxlintOptions = Parameters<typeof oxlint>[0]

/** The house Emission, with `.gitignore` reading turned off so the result does not depend on the cwd. */
async function house(options: OxlintOptions = {}): Promise<OxlintConfig> {
  return oxlint({ gitignore: false, isInEditor: false, ...options })
}

/** The scopes the installed Oxlint already answers to, from its own configuration schema. */
function reservedScopes(): string[] {
  const schema = JSON.parse(readFileSync(
    fileURLToPath(new URL('../../../node_modules/oxlint/configuration_schema.json', import.meta.url)),
    'utf8',
  )) as { definitions: Record<string, unknown> }

  const plugins = schema.definitions.LintPlugins as { items: { anyOf: Array<{ $ref: string }> } }
  const ref = plugins.items.anyOf[0]?.$ref.replace('#/definitions/', '')
  return (schema.definitions[ref ?? ''] as { enum: string[] }).enum
}

describe('the Emission jsPlugins declarations', () => {
  it('declares each alias once per Emission, never once per override', async () => {
    for (const options of [{}, { stylistic: true }]) {
      const names = jsPluginDeclarations(await house(options)).map(entry => entry.name)
      const duplicates = names.filter((name, index) => names.indexOf(name) !== index)

      expect(names.length, `no declaration with ${JSON.stringify(options)}`).toBeGreaterThan(0)
      expect(duplicates, `duplicated aliases with ${JSON.stringify(options)}`).toEqual([])
    }
  })

  it('aliases every declaration as its Plugin id, in the object form a scoped package needs', async () => {
    const entries = (await house({ stylistic: true })).overrides?.flatMap(override => override.jsPlugins ?? []) ?? []

    expect(entries.length).toBeGreaterThan(0)
    for (const entry of entries) {
      expect(entry, 'a string entry cannot name a scoped package').toBeTypeOf('object')
      const { name, specifier } = entry as { name: string, specifier: string }

      expect(specifier).toBeTypeOf('string')
      if (!isPluginId(name)) {
        throw new Error(`"${name}" is not a registered Plugin id.`)
      }
      // The alias is the id, so a rule key reads the same in both Emissions.
      expect(pluginDefinition(name).oxlint).toMatchObject({ alias: name })
    }
  })

  it('resolves a Bundle-owned package to an absolute path that exists on disk', async () => {
    const entries = jsPluginDeclarations(await house({ stylistic: true }))
    const bundleOwned = entries.filter(entry =>
      ['antfu', 'command', 'e18e', 'perfectionist', 'regexp', 'unused-imports'].includes(entry.name),
    )

    expect(bundleOwned.map(entry => entry.name).sort())
      .toEqual(['antfu', 'command', 'e18e', 'perfectionist', 'regexp', 'unused-imports'])
    for (const entry of bundleOwned) {
      expect(isAbsolute(entry.specifier), `${entry.name} is an absolute path`).toBe(true)
      expect(existsSync(entry.specifier), `${entry.specifier} exists on disk`).toBe(true)
    }
  })

  it('falls back to the bare package name for a peer id the Bundle does not ship', async () => {
    const entries = jsPluginDeclarations(await house({ antislop: true, stylistic: true }))
    const peers = Object.fromEntries(entries.map(entry => [entry.name, entry.specifier]))

    expect(peers).toMatchObject({
      'style': '@stylistic/eslint-plugin',
      'slop': 'eslint-plugin-slop',
      'sonar': 'eslint-plugin-sonarjs',
    })
  })

  it('keeps the single jsPlugins declaration first', async () => {
    const config = await house({ stylistic: true })

    expect(config.overrides?.[0]?.jsPlugins).toBeDefined()
  })

  it('never takes a name Oxlint already answers to, `eslint` included', async () => {
    const reserved = reservedScopes()
    const names = jsPluginDeclarations(await house({ stylistic: true })).map(entry => entry.name)

    expect(reserved).toContain('eslint')
    expect(names.filter(name => reserved.includes(name))).toEqual([])
  })

  // Two real-binary runs, so give it room beyond Vitest's default when the suite runs in parallel.
  it('loads the stylistic plugin and fires its rule once the Module is on', { timeout: 20_000 }, async () => {
    // `style/quotes` on a file that uses double quotes, with the house single-quote setting.
    await expectJsPluginFires({
      plugin: 'style',
      rule: 'style/quotes',
      fixtures: STYLISTIC_FIXTURES,
      fixture: 'violations.js',
      clean: 'clean.js',
      options: { stylistic: true },
    })
  })

  it('declares no stylistic plugin — and emits no style rule — while the Module is off', async () => {
    // The javascript Module's `antfu` / `unused-imports` plugins are always on, so the Emission is
    // never declaration-free; what `stylistic: false` must remove is the `style` alias itself, and
    // with it every `style/` rule an undeclared alias would make unloadable.
    const config = await house()

    expect(jsPluginDeclarations(config).map(entry => entry.name)).not.toContain('style')
    expect(JSON.stringify(config)).not.toContain('"style/')
  })
})
