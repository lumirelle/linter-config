import type { Linter } from 'eslint'
import type { Options } from '../src/types'
import { fileURLToPath } from 'node:url'
import { ESLint } from 'eslint'
import { braceExpand, minimatch } from 'minimatch'
import { afterAll, describe, expect, it } from 'vitest'
import { eslint } from '../src/eslint'
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

/** The Emission `options` resolves to with `oxlint` forced off: what the Bridge closes over. */
async function emissionOf(options: Options): Promise<Linter.Config[]> {
  return eslint(houseOptions({ ...options, oxlint: false }))
}

/**
 * The Bridge of `options`: the tail that enabling `oxlint` adds to the very same options resolved
 * without it. Deriving it through the Composer keeps this file on the public seam — the Bridge
 * builder is never imported, so it stays free to change.
 */
async function bridgeOf(options: Options = {}): Promise<Linter.Config[]> {
  const withOxlint = await eslint(houseOptions({ ...options, oxlint: options.oxlint ?? true }))
  return withOxlint.slice((await emissionOf(options)).length)
}

/** The rules a Bridge turns off, per scope, spelled the way Oxlint spells them. */
function scopesOf(bridge: readonly Linter.Config[]): Map<string, Set<string>> {
  const scopes = new Map<string, Set<string>>()
  for (const config of bridge) {
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

/**
 * A config as the resolved array's contract: name, scope and rules.
 *
 * Two resolutions cannot be compared whole: a processor is glue the Bundle builds per call, so its
 * methods are fresh closures. Order and severity are what a consumer observes, so they are what
 * these tests compare.
 */
function shapeOf(configs: readonly Linter.Config[]): unknown[] {
  return configs.map(config => ({
    name: config.name,
    ...(config.files ? { files: globsOf(config.files) } : {}),
    ...(config.ignores ? { ignores: globsOf(config.ignores) } : {}),
    rules: config.rules ?? {},
  }))
}

/** A consumer config that re-enables a rule Oxlint owns, for the ordering tests below. */
const CONSUMER: Linter.Config = { name: 'consumer', files: ['**/*.ts'], rules: { 'no-console': 'error' } }

describe('the Emission without `oxlint`', () => {
  it('is the same whether the option is absent or false, and turns nothing off', async () => {
    const absent = await eslint(houseOptions())
    expect(shapeOf(await eslint(houseOptions({ oxlint: false })))).toEqual(shapeOf(absent))

    // Source alone decides severities, so a rule Oxlint would own is still reported by ESLint.
    const rules = effectiveRules(absent, 'src/index.ts')
    expect(severity(rules['no-console'])).toBe('error')
    expect(severity(rules.eqeqeq)).toBe('error')
  })
})

describe('the Emission with `oxlint`', () => {
  it('is the Bridge-free array plus a tail, never a reordering', async () => {
    for (const options of OPTION_POINTS) {
      const without = await emissionOf(options)
      const with_ = await eslint(houseOptions({ ...options, oxlint: true }))

      expect(shapeOf(with_).slice(0, without.length), JSON.stringify(options)).toEqual(shapeOf(without))
      expect(with_.length, JSON.stringify(options)).toBeGreaterThan(without.length)
    }
  })

  it('closes with a Bridge that turns off exactly what the Oxlint Emission reports, per scope', async () => {
    for (const options of OPTION_POINTS) {
      expect(sorted(scopesOf(await bridgeOf(options))), JSON.stringify(options))
        .toEqual(sorted(await oxlintScopes(options)))
    }
  })

  it('mirrors a scope narrow enough that nothing is disabled outside it', async () => {
    const bridge = await bridgeOf({ vue: true })
    const keys = (config: Linter.Config): string[] => Object.keys(config.rules ?? {})
    const global = bridge.filter(config => !config.files).flatMap(keys)

    const vueOnly = bridge.filter(config => config.files && globsOf(config.files).every(glob => glob.endsWith('.vue'))).flatMap(keys)
    expect(vueOnly.filter(key => key.startsWith('vue/')).length).toBeGreaterThan(0)
    expect(global.filter(key => key.startsWith('vue/'))).toEqual([])

    // The rules of the `.vue`-only object are turned off where Oxlint reads `.vue` files, and nowhere else.
    expect(effectiveRules(bridge, 'src/component.ts')['vue/no-arrow-functions-in-watch']).toBeUndefined()
    expect(effectiveRules(bridge, 'src/component.vue')['vue/no-arrow-functions-in-watch']).toBe('off')
  })

  it('leaves the objects the Oxlint Emission never takes without Bridge entries', async () => {
    const keys = (await bridgeOf({ markdown: true, svelte: true })).flatMap(config => Object.keys(config.rules ?? {}))

    // `svelte` and the markup Domain need a parser or processor, so Oxlint never reads those files.
    expect(keys.filter(key => key.startsWith('svelte/'))).toEqual([])
    expect(keys.filter(key => key.startsWith('md/'))).toEqual([])
  })

  it('turns off what Oxlint reports and leaves what it cannot', async () => {
    const rules = effectiveRules(await eslint(houseOptions({ oxlint: true })), 'src/index.ts')
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
})

describe('a consumer config appended after the factory', () => {
  it('still resolves with the Bridge last, so the rule it re-enabled stays off', async () => {
    const bridge = await bridgeOf()
    const configs = await eslint(houseOptions({ oxlint: true })).append(CONSUMER)

    // The consumer's object lands before the Bridge, so the Bridge is still the tail.
    expect(configs.slice(-bridge.length)).toEqual(bridge)

    // Left to itself the consumer's `error` would win, which is the double report this closes.
    const reopened = effectiveRules((await eslint(houseOptions())).concat(CONSUMER), 'src/index.ts')
    expect(severity(reopened['no-console'])).toBe('error')
    expect(severity(effectiveRules(configs, 'src/index.ts')['no-console'])).toBe('off')
  })

  it('holds through any mix of insert, override and append', async () => {
    const bridge = await bridgeOf()
    const base: Linter.Config = { name: 'base', files: ['**/*.ts'], rules: { eqeqeq: 'error' } }
    const again: Linter.Config = { name: 'again', files: ['**/*.ts'], rules: { 'no-console': 'error' } }

    const configs = await eslint(houseOptions({ oxlint: true }))
      .append(CONSUMER)
      .insertAfter('lumirelle/javascript/rules', base)
      .override('lumirelle/javascript/rules', { rules: { 'no-console': 'error' } })
      .append(again)

    expect(configs.slice(-bridge.length)).toEqual(bridge)
    expect(configs.some(config => config.name === 'base')).toBe(true)
    const rules = effectiveRules(configs, 'src/index.ts')
    expect(severity(rules['no-console'])).toBe('off')
    expect(severity(rules.eqeqeq)).toBe('off')
  })
})

describe('a type-aware rule', () => {
  // Source only emits its type-aware rules with a `tsconfigPath`; Oxlint only reports them in its
  // type-aware mode, which `typeAware` — and nothing else — turns on.
  const TYPE_AWARE: Options = { typescript: { tsconfigPath: 'tsconfig.json' } }

  const floating = async (options: Options): Promise<unknown> =>
    severity(effectiveRules(await eslint(houseOptions(options)), 'src/index.ts')['ts/no-floating-promises'])

  it('stays enabled in ESLint unless the Oxlint object form sets `typeAware`', async () => {
    expect(await floating(TYPE_AWARE)).toBe('error')
    expect(await floating({ ...TYPE_AWARE, oxlint: true })).toBe('error')
    expect(await floating({ ...TYPE_AWARE, oxlint: { typeCheck: true } })).toBe('error')
    expect(await floating({ ...TYPE_AWARE, oxlint: { typeAware: true } })).toBe('off')
  })

  it('is unaffected by `typeCheck` alone, which is Oxlint root options only', async () => {
    expect(await bridgeOf({ ...TYPE_AWARE, oxlint: { typeCheck: true } }))
      .toEqual(await bridgeOf({ ...TYPE_AWARE, oxlint: true }))
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
