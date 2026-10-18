import type { Linter } from 'eslint'
import type { Options } from '../src/types'
import { fileURLToPath } from 'node:url'
import { ESLint } from 'eslint'
import { braceExpand, minimatch } from 'minimatch'
import { afterAll, describe, expect, it } from 'vitest'
import { BRIDGE_NAME_SUFFIX } from '../src/bridge'
import { eslint, oxlintBridge } from '../src/eslint'
import { oxlint } from '../src/oxlint'
import { pluginDefinition, pluginIdOfRuleKey } from '../src/plugins'
import { houseOptions } from './helpers/emission'
import { lint, project, scratchDirectory } from './helpers/oxlint-binary'

const FIXTURES = fileURLToPath(new URL('./fixtures/javascript/', import.meta.url))

/** Option points that move rules between the two Emissions: Modules on and off, and the slices. */
const OPTION_POINTS: Options[] = [
  {},
  { stylistic: true },
  { vue: true },
  { test: true, perfectionist: true },
  { imports: false, jsdoc: false, node: false, unicorn: false },
]

/** Oxlint's spelling of a Source rule key, read from the Plugin registry the Emission maps with. */
function oxlintRuleKey(key: string): string {
  const id = pluginIdOfRuleKey(key)
  const builtin = id ? pluginDefinition(id).oxlint?.builtin : undefined
  return id && builtin ? `${builtin}/${key.slice(id.length + 1)}` : key
}

/** The flat glob list a config declares; ESLint allows a glob group, which Source never emits. */
function globsOf(globs: Linter.Config['files']): string[] {
  return (globs ?? []).flatMap(glob => (Array.isArray(glob) ? glob : [glob]))
}

/**
 * A scope as both Emissions can spell it: Oxlint's builder expands a brace glob into one glob per
 * alternative, and an object without `files` applies to every file.
 */
function scopeOf(files?: Linter.Config['files'], ignores?: Linter.Config['files']): string {
  const expand = (globs: Linter.Config['files']): string[] => {
    const flat = globsOf(globs).flatMap(glob => braceExpand(glob)).sort()
    return flat.length > 0 ? flat : ['**/*']
  }
  return JSON.stringify({ files: expand(files), ignores: expand(ignores) })
}

/** Rule keys per scope; several Config objects may share a scope, and Oxlint may merge them. */
function collect(target: Map<string, Set<string>>, scope: string, keys: readonly string[]): void {
  const collected = target.get(scope) ?? new Set<string>()
  for (const key of keys) {
    collected.add(key)
  }
  target.set(scope, collected)
}

/** A scope-keyed rule set in a comparable, order-independent form. */
function sorted(scopes: Map<string, Set<string>>): Array<[string, string[]]> {
  return [...scopes]
    .map(([scope, keys]): [string, string[]] => [scope, [...keys].sort()])
    .sort(([left], [right]) => left.localeCompare(right))
}

/** The rules the Oxlint Emission of `options` reports, per scope. */
async function oxlintScopes(options: Options): Promise<Map<string, Set<string>>> {
  const scopes = new Map<string, Set<string>>()
  for (const override of (await oxlint(houseOptions(options))).overrides ?? []) {
    const keys = Object.keys(override.rules ?? {})
    if (keys.length > 0) {
      collect(scopes, scopeOf(override.files, override.excludeFiles), keys)
    }
  }
  return scopes
}

/** The rules a Bridge of `options` turns off, per scope, spelled the way Oxlint spells them. */
function bridgeScopes(options: Options): Map<string, Set<string>> {
  const scopes = new Map<string, Set<string>>()
  for (const config of oxlintBridge(houseOptions(options))) {
    collect(scopes, scopeOf(config.files, config.ignores), Object.keys(config.rules ?? {}).map(oxlintRuleKey))
  }
  return scopes
}

/** What ESLint would apply to `file`: every config that matches, later ones winning per rule. */
function effectiveRules(configs: readonly Linter.Config[], file: string): Record<string, unknown> {
  const effective: Record<string, unknown> = {}
  for (const config of configs) {
    if (config.files && !globsOf(config.files).some(glob => minimatch(file, glob))) {
      continue
    }
    if (globsOf(config.ignores).some(glob => minimatch(file, glob))) {
      continue
    }
    Object.assign(effective, config.rules ?? {})
  }
  return effective
}

/** A rule entry's severity, which is its first element when it carries options. */
function severity(entry: unknown): unknown {
  return Array.isArray(entry) ? entry[0] : entry
}

/** Rules by Config object name, so a doubled object collapses into the same entry. */
function rulesByName(configs: readonly Linter.Config[]): Record<string, unknown> {
  const byName: Record<string, unknown> = {}
  for (const config of configs) {
    Object.assign(byName, { [config.name ?? '(unnamed)']: config.rules ?? {} })
  }
  return byName
}

describe('oxlintBridge()', () => {
  it('turns off exactly the rules the Oxlint Emission reports, in the same scopes', async () => {
    for (const options of OPTION_POINTS) {
      expect(sorted(bridgeScopes(options)), JSON.stringify(options)).toEqual(sorted(await oxlintScopes(options)))
    }
  })

  it('mirrors a scope narrow enough that nothing is disabled outside it', async () => {
    const bridge = oxlintBridge(houseOptions({ vue: true }))
    const keys = (config: Linter.Config): string[] => Object.keys(config.rules ?? {})
    const global = bridge.filter(config => !config.files).flatMap(keys)

    const vueOnly = bridge.filter(config => config.files && globsOf(config.files).every(glob => glob.endsWith('.vue'))).flatMap(keys)
    expect(vueOnly.filter(key => key.startsWith('vue/')).length).toBeGreaterThan(0)
    expect(global.filter(key => key.startsWith('vue/'))).toEqual([])

    // The rules of the `.vue`-only object are turned off where Oxlint reads `.vue` files, and nowhere else.
    expect(effectiveRules(bridge, 'src/component.ts')['vue/no-arrow-functions-in-watch']).toBeUndefined()
    expect(effectiveRules(bridge, 'src/component.vue')['vue/no-arrow-functions-in-watch']).toBe('off')
  })

  it('turns off nothing for an object the Oxlint Emission leaves out', () => {
    const keys = oxlintBridge(houseOptions({ markdown: true, svelte: true })).flatMap(config => Object.keys(config.rules ?? {}))

    // `svelte` and the markup Domain need a parser or processor, so Oxlint never reads those files.
    expect(keys.filter(key => key.startsWith('svelte/'))).toEqual([])
    expect(keys.filter(key => key.startsWith('md/'))).toEqual([])
  })

  it('keeps a type-aware rule on unless Oxlint runs type-aware', () => {
    const report = (options: Options): string[] =>
      oxlintBridge(houseOptions(options)).flatMap(config => Object.keys(config.rules ?? {}))

    // `ts/no-floating-promises` is type-aware only: Oxlint maps it in neither mode's default, so
    // the Bridge must not turn it off when the caller did not ask for the type-aware mode.
    expect(report({})).not.toContain('ts/no-floating-promises')
    expect(report({ oxlint: { typeAware: true } })).toEqual(report({}))
  })
})

describe('eslint({ oxlint })', () => {
  it('appends the Bridge last, and only when asked', async () => {
    const without = (await eslint(houseOptions())).map(config => config.name ?? '')
    expect(without.filter(name => name.endsWith(BRIDGE_NAME_SUFFIX))).toEqual([])

    const with_ = (await eslint(houseOptions({ oxlint: true }))).map(config => config.name ?? '')
    const first = with_.findIndex(name => name.endsWith(BRIDGE_NAME_SUFFIX))

    expect(first).toBeGreaterThan(0)
    expect(with_.slice(first).every(name => name.endsWith(BRIDGE_NAME_SUFFIX))).toBe(true)
    expect(with_.slice(0, first).some(name => name.endsWith(BRIDGE_NAME_SUFFIX))).toBe(false)
    // Everything Source emits, `disables` included, comes before the Bridge.
    expect(with_.slice(0, first)).toEqual(without)
  })

  it('appends the same objects oxlintBridge() returns, so the exported helper is what keeps the order', async () => {
    for (const options of OPTION_POINTS) {
      // `markdown` is off because its `.md` default ignore is the composer's, not the Bridge's; it
      // lands on every unscoped config object, so it would only blur this comparison.
      const configs = await eslint(houseOptions({ ...options, markdown: false, oxlint: true }))
      const tail = configs.slice(configs.findIndex(config => config.name?.endsWith(BRIDGE_NAME_SUFFIX)))
      expect(tail, JSON.stringify(options))
        .toEqual(oxlintBridge(houseOptions({ ...options, markdown: false, oxlint: true })))
    }
  })

  it('turns off what Oxlint reports and leaves what it cannot', async () => {
    const configs = await eslint(houseOptions({ oxlint: true }))
    const rules = effectiveRules(configs, 'src/index.ts')
    const withoutBridge = effectiveRules(await eslint(houseOptions()), 'src/index.ts')

    // Oxlint reports `no-console` and `eqeqeq`, so ESLint stops reporting them...
    expect(severity(withoutBridge['no-console'])).toBe('error')
    expect(severity(withoutBridge.eqeqeq)).toBe('error')
    expect(severity(rules['no-console'])).toBe('off')
    expect(severity(rules.eqeqeq)).toBe('off')
    // ...and keeps `dot-notation`, which Oxlint only implements in its type-aware mode.
    expect(severity(withoutBridge['dot-notation'])).toBe('error')
    expect(severity(rules['dot-notation'])).toBe('error')
  })

  it('feeds the object form into the mapping, so a type-aware consumer keeps agreeing', async () => {
    const options: Options = { oxlint: { typeAware: true, typeCheck: true } }
    expect(sorted(bridgeScopes(options))).toEqual(sorted(await oxlintScopes(options)))
  })

  it('can be re-appended after a consumer config without changing the result', async () => {
    const options = houseOptions({ oxlint: true })
    const consumer: Linter.Config = { name: 'consumer', files: ['**/*.ts'], rules: { 'no-console': 'error' } }
    const bridge = oxlintBridge(options)

    const once = await eslint(options).append(consumer, ...bridge)
    const twice = await eslint(options).append(consumer, ...bridge, ...bridge)

    // The consumer re-enabled a rule Oxlint owns; the Bridge appended after it turns it back off,
    // and appending it again changes nothing.
    expect(severity(effectiveRules(once, 'src/index.ts')['no-console'])).toBe('off')
    expect(rulesByName(twice)).toEqual(rulesByName(once))
  })
})

describe('the Bridge against the real binaries', () => {
  const scratch = scratchDirectory()

  afterAll(() => {
    scratch.remove()
  })

  it('leaves ESLint reporting only the rules Oxlint cannot, which Oxlint keeps reporting', { timeout: 30_000 }, async () => {
    const options = houseOptions({ oxlint: true })
    const eslintApi = new ESLint({ cwd: FIXTURES, overrideConfig: await eslint(options), overrideConfigFile: true })

    const ruleIds = async (files: string[]): Promise<string[]> =>
      (await eslintApi.lintFiles(files)).flatMap(result => result.messages.map(message => message.ruleId ?? '<fatal>'))

    // `violations.js` breaks `eqeqeq`, `no-alert`, `no-console` and the unused-import rules, all of
    // which Oxlint reports; with the Bridge, ESLint says nothing about them.
    expect(await ruleIds(['violations.js'])).toEqual([])
    // `dot-notation.js` breaks a rule Oxlint only has in its type-aware mode, so it stays ESLint's.
    expect(await ruleIds(['dot-notation.js'])).toEqual(['dot-notation'])

    const run = lint(project(scratch.directory, 'bridge', await oxlint(options), FIXTURES))
    expect(run.diagnostics.filter(diagnostic => diagnostic.file === 'fixtures/violations.js').map(diagnostic => diagnostic.ruleId))
      .toEqual(['no-unused-vars', 'unused-imports/no-unused-imports', 'eqeqeq', 'no-alert', 'no-console'])
    expect(run.diagnostics.filter(diagnostic => diagnostic.file === 'fixtures/dot-notation.js')).toEqual([])
  })
})
