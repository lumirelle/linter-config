import type { OxlintConfig } from 'oxlint'
import {
  cpSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  realpathSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, isAbsolute, join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { describe, expect, it } from 'vitest'
import { oxlint } from '../src/oxlint'
import { blacklistEntry } from '../src/oxlint/blacklist'
import { isPluginId, PLUGIN_IDS, pluginDefinition } from '../src/plugins'
import { jsPluginDeclarations } from './helpers/emission'
import { expectJsPluginFires } from './helpers/oxlint-jsplugin'

const STYLISTIC_FIXTURES = fileURLToPath(new URL('./fixtures/stylistic/', import.meta.url))
const CONFIG_ROOT = fileURLToPath(new URL('../', import.meta.url))
const BUNDLE_ROOT = fileURLToPath(new URL('../../plugins-oxlint/', import.meta.url))

/**
 * Every Plugin id Oxlint is asked to load as a jsPlugin, with the package the registry names for it:
 * a blacklisted id keeps its `jsPlugins` entry but no rule reaches it, so no Emission declares it.
 */
const LOADED = PLUGIN_IDS.flatMap(id => {
  const oxlint = pluginDefinition(id).oxlint
  if (blacklistEntry(id) || !oxlint || !('jsPlugin' in oxlint) || !oxlint.jsPlugin) {
    return []
  }
  return [{ id, packageName: oxlint.jsPlugin }]
})

/** The packages the Bundle ships: its own `dependencies`, which is also what its resolver is gated on. */
const SHIPPED = new Set(
  Object.keys(
    (
      JSON.parse(readFileSync(join(BUNDLE_ROOT, 'package.json'), 'utf8')) as {
        dependencies: Record<string, string>
      }
    ).dependencies,
  ),
)

const SHIPPED_IDS = LOADED.filter(({ packageName }) => SHIPPED.has(packageName))
const UNSHIPPED_IDS = LOADED.filter(({ packageName }) => !SHIPPED.has(packageName))

/** The Modules that bring the remaining ids into play, so one Emission declares every loaded one. */
const EVERY_JSPLUGIN_MODULE = {
  antislop: true,
  solid: true,
  stylistic: true,
  unocss: true,
} as const

type OxlintOptions = Parameters<typeof oxlint>[0]

/** The house Emission, with `.gitignore` reading turned off so the result does not depend on the cwd. */
async function house(options: OxlintOptions = {}): Promise<OxlintConfig> {
  return oxlint({ gitignore: false, isInEditor: false, ...options })
}

/**
 * A consumer install, thrown away with the test: the Bundle unpacked under `node_modules`, the
 * packages it depends on beside it, and the consumer's copy of the peer plugins it does not ship.
 *
 * The probe is written next to the Bundle's own entry, so it resolves from exactly the directories
 * the Bundle does, one of which is the consumer's `node_modules`, which is the whole hazard.
 */
function consumerInstall(): { entry: string; probe: string; remove: () => void } {
  const directory = mkdtempSync(join(tmpdir(), 'lumirelle-jsplugins-'))
  const installed = join(directory, 'node_modules/@lumirelle/linter-plugins-oxlint')
  mkdirSync(installed, { recursive: true })
  cpSync(join(BUNDLE_ROOT, 'dist'), join(installed, 'dist'), { recursive: true })
  cpSync(join(BUNDLE_ROOT, 'package.json'), join(installed, 'package.json'))

  const link = (from: string, packageName: string): void => {
    const target = join(directory, 'node_modules', packageName)
    mkdirSync(dirname(target), { recursive: true })
    symlinkSync(realpathSync(from), target)
  }
  for (const packageName of SHIPPED) {
    link(join(BUNDLE_ROOT, 'node_modules', packageName), packageName)
  }
  for (const { packageName } of UNSHIPPED_IDS) {
    link(join(CONFIG_ROOT, 'node_modules', packageName), packageName)
  }

  const probe = join(installed, 'probe.mjs')
  writeFileSync(probe, 'export const resolve = specifier => import.meta.resolve(specifier)\n')

  return {
    entry: join(installed, 'dist/index.mjs'),
    probe,
    remove: () => rmSync(directory, { force: true, recursive: true }),
  }
}

/** The scopes the installed Oxlint already answers to, from its own configuration schema. */
function reservedScopes(): string[] {
  const schema = JSON.parse(
    readFileSync(
      fileURLToPath(
        new URL('../../../node_modules/oxlint/configuration_schema.json', import.meta.url),
      ),
      'utf8',
    ),
  ) as { definitions: Record<string, unknown> }

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
    const entries =
      (await house({ stylistic: true })).overrides?.flatMap(override => override.jsPlugins ?? [])
      ?? []

    expect(entries.length).toBeGreaterThan(0)
    for (const entry of entries) {
      expect(entry, 'a string entry cannot name a scoped package').toBeTypeOf('object')
      const { name, specifier } = entry as { name: string; specifier: string }

      expect(specifier).toBeTypeOf('string')
      if (!isPluginId(name)) {
        throw new Error(`"${name}" is not a registered Plugin id.`)
      }
      // The alias is the id, so a rule key reads the same in both Emissions.
      expect(pluginDefinition(name).oxlint).toMatchObject({ alias: name })
    }
  })

  it('emits a path for the packages the Bundle ships and the bare name for every other id', async () => {
    const specifiers = Object.fromEntries(
      jsPluginDeclarations(await house(EVERY_JSPLUGIN_MODULE)).map(entry => [
        entry.name,
        entry.specifier,
      ]),
    )

    // Both branches of the rule have to be exercised, or the loop below proves nothing.
    expect(SHIPPED_IDS.length).toBeGreaterThan(0)
    expect(UNSHIPPED_IDS.length).toBeGreaterThan(0)
    expect(Object.keys(specifiers).sort(), 'every loaded id is declared').toEqual(
      LOADED.map(({ id }) => id).sort(),
    )
    for (const { id, packageName } of LOADED) {
      const specifier = specifiers[id]
      if (!specifier) {
        throw new Error(`the Emission declares no "${id}" entry`)
      }

      if (SHIPPED.has(packageName)) {
        expect(isAbsolute(specifier), `"${id}" ships as a resolved path`).toBe(true)
        expect(existsSync(specifier), `${specifier} exists on disk`).toBe(true)
      } else {
        // The consumer's install, spelled the way the consumer installs it.
        expect(specifier, `"${id}" is not the Bundle's to ship`).toBe(packageName)
      }
    }
  })

  it("declines a package that resolves from the Bundle's own directories but is not its dependency", async () => {
    const { entry, probe, remove } = consumerInstall()
    try {
      const { resolve } = (await import(pathToFileURL(probe).href)) as {
        resolve: (specifier: string) => string
      }
      const bundle = (await import(pathToFileURL(entry).href)) as {
        jsPlugins: Readonly<Record<string, string>>
        resolveJsPlugin: (id: string) => string | undefined
      }

      expect(UNSHIPPED_IDS.length).toBeGreaterThan(0)
      for (const { id, packageName } of UNSHIPPED_IDS) {
        // The consumer installed the package in the same tree the Bundle sits in, so the ESM
        // resolver walks up into it: reachability cannot be what "the Bundle ships this" means.
        expect(
          () => resolve(packageName),
          `"${packageName}" resolves from the Bundle's directories`,
        ).not.toThrow()
        expect(bundle.resolveJsPlugin(id), `"${id}" is not the Bundle's to resolve`).toBeUndefined()
        expect(bundle.jsPlugins[id], `the Emission names "${id}" as the bare package`).toBe(
          packageName,
        )
      }

      // The other half of the rule still holds in that tree: a declared package resolves there.
      for (const { id } of SHIPPED_IDS) {
        expect(
          isAbsolute(bundle.resolveJsPlugin(id) ?? ''),
          `"${id}" resolves beside the Bundle`,
        ).toBe(true)
      }
    } finally {
      remove()
    }
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
  it(
    'loads the stylistic plugin and fires its rule once the Module is on',
    { timeout: 20_000 },
    async () => {
      // `style/quotes` on a file that uses double quotes, with the house single-quote setting.
      await expectJsPluginFires({
        plugin: 'style',
        rule: 'style/quotes',
        fixtures: STYLISTIC_FIXTURES,
        fixture: 'violations.js',
        clean: 'clean.js',
        options: { stylistic: true },
      })
    },
  )

  it('declares no stylistic plugin, and emits no style rule, while the Module is off', async () => {
    // The javascript Module's `antfu` / `unused-imports` plugins are always on, so the Emission is
    // never declaration-free; what `stylistic: false` must remove is the `style` alias itself, and
    // with it every `style/` rule an undeclared alias would make unloadable.
    const config = await house()

    expect(jsPluginDeclarations(config).map(entry => entry.name)).not.toContain('style')
    expect(JSON.stringify(config)).not.toContain('"style/')
  })
})
