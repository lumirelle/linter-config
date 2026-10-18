import type { ConfigObject, Glob, Options, PnpmOptions, StylisticOptions } from './types'
import { existsSync, readFileSync } from 'node:fs'
import { dirname, join, parse } from 'node:path'
import process from 'node:process'
import { isInEditorEnv } from './editor'
import { assertGlobVocabulary } from './globs'
import { angular } from './modules/angular'
import { antislop } from './modules/antislop'
import { astro } from './modules/astro'
import { command } from './modules/command'
import { disables } from './modules/disables'
import { e18e } from './modules/e18e'
import { eslintComments } from './modules/eslint-comments'
import { formatters } from './modules/formatters'
import { ignores } from './modules/ignores'
import { imports } from './modules/imports'
import { javascript } from './modules/javascript'
import { jsdoc } from './modules/jsdoc'
import { jsonc } from './modules/jsonc'
import { jsx } from './modules/jsx'
import { markdown } from './modules/markdown'
import { nextjs } from './modules/nextjs'
import { node } from './modules/node'
import { perfectionist } from './modules/perfectionist'
import { pnpm } from './modules/pnpm'
import { react } from './modules/react'
import { regexp } from './modules/regexp'
import { solid } from './modules/solid'
import { sortPackageJson, sortTsconfig } from './modules/sort'
import { stylistic } from './modules/stylistic'
import { svelte } from './modules/svelte'
import { isTestEnabled, test, testOverrides } from './modules/test'
import { toml } from './modules/toml'
import { typescript } from './modules/typescript'
import { unicorn } from './modules/unicorn'
import { unocss } from './modules/unocss'
import { vue } from './modules/vue'
import { yaml } from './modules/yaml'
import { isPackageInstalled } from './packages'
import { enabledRuleKeys } from './rules'

/** Config object names are `lumirelle/<tail>`; anything else is a Module id. */
export const CONFIG_NAME_PREFIX = 'lumirelle/'

type Overrides = NonNullable<Options['overrides']>
type Override = NonNullable<Overrides[keyof Overrides]>

/**
 * Composes every Module into Source's Config objects; the only input to both Adapters.
 *
 * The order below is the emission order both Adapters preserve; the Modules themselves live in
 * `src/modules/<module>.ts`, and the ones that switch rules off read what the earlier Modules
 * actually enabled, which is why they compose last.
 */
export function source(options: Options = {}): ConfigObject[] {
  const isInEditor = options.isInEditor ?? isInEditorEnv()
  const stylisticSlices = isStylisticEnabled(options.stylistic)
  const typescriptEnabled = isTypeScriptEnabled(options.typescript)
  // Upstream treats `.vue` as one more component extension of the TypeScript Module, so the
  // component parser's scripts are typed whenever `vue` is on.
  const componentExts = [...options.componentExts ?? [], ...options.vue ? ['vue'] : []]

  // `test` and `disables` turn off rules owned by the Modules above them, and derive that table
  // from what those Modules actually emit, so they compose after them.
  const composed: ConfigObject[] = [
    ...ignores(options),
    ...javascript({ isInEditor }),
    ...eslintComments(),
    ...command(),
    ...options.perfectionist === false ? [] : perfectionist(),
    ...options.jsx ? jsx() : [],
    ...typescriptEnabled ? typescript({ ...options, componentExts }) : [],
    ...options.node === false ? [] : node(),
    ...options.jsdoc === false ? [] : jsdoc({ stylistic: stylisticSlices }),
    ...options.imports === false ? [] : imports({ stylistic: stylisticSlices }),
    ...options.e18e === false ? [] : e18e({ isInEditor, type: options.type }),
    ...options.unicorn === false ? [] : unicorn(),
    ...options.antislop === true ? antislop() : [],
    ...isStylisticEnabled(options.stylistic) ? stylistic(stylisticOptions(options.stylistic)) : [],
    ...options.regexp === false ? [] : regexp(),
    ...options.vue ? vue({ ...options, componentExts, typescript: typescriptEnabled }) : [],
    ...options.react ? react(options) : [],
    ...options.nextjs ? nextjs() : [],
    ...options.solid ? solid(options) : [],
    ...options.svelte ? svelte({ ...options, stylistic: isStylisticEnabled(options.stylistic) }) : [],
    ...options.unocss ? unocss() : [],
    ...options.astro ? astro({ stylistic: isStylisticEnabled(options.stylistic) }) : [],
    ...options.angular ? angular() : [],
  ]

  // The data and markup Modules follow Upstream's factory order: `jsonc` carries the two `sort`
  // objects, then `pnpm`, `yaml`, `toml` and `markdown`; all of them are ESLint-only, because
  // Oxlint has no parser or processor hook. `markdown` disables rules of the Modules above it
  // inside code blocks, so it reads what they actually enabled.
  composed.push(
    ...options.jsonc === false ? [] : [...jsonc({ stylistic: stylisticSlices }), ...sortPackageJson(), ...sortTsconfig()],
    ...pnpmModule(options.pnpm, { isInEditor, stylistic: stylisticSlices }),
    ...options.yaml === false ? [] : yaml({ stylistic: stylisticSlices }),
    ...options.toml === false ? [] : toml({ stylistic: stylisticSlices }),
    ...formatterModules(options.formatters),
  )

  if (options.markdown !== false) {
    composed.push(...markdown({ componentExts: options.componentExts, enabled: enabledRuleKeys(composed) }))
  }

  if (isTestEnabled(options.test)) {
    composed.push(...test({ enabled: enabledRuleKeys(composed), isInEditor, overrides: testOverrides(options.test) }))
  }

  const configs = applyOverrides([...composed, ...disables(composed)], options.overrides)

  // Invariant: a glob must work in both tools, so Source rejects anything outside the
  // shared vocabulary before an Adapter ever sees it.
  assertGlobVocabulary(configs.flatMap(config => [...(config.files ?? []), ...(config.ignores ?? [])] as Glob[]))

  return configs
}

/**
 * Whether the stylistic slices of otherwise-useful Modules are on.
 *
 * Upstream enables them by default; the house turns them off ({@link Options.stylistic}), so a
 * Module asks this instead of its own default.
 */
function isStylisticEnabled(option: Options['stylistic']): boolean {
  return option !== undefined && option !== false
}

/**
 * The `formatters` Module, which is opt-in: Upstream enables it only for a truthy option, and so
 * does the house. `true` asks for the formatters that need no extra Prettier plugin.
 */
function formatterModules(option: Options['formatters']): ConfigObject[] {
  if (!option) {
    return []
  }
  return formatters(option === true ? { css: true, graphql: true, html: true, markdown: true } : option)
}

/**
 * The `pnpm` Module, which Upstream enables only where a `pnpm-workspace.yaml` exists.
 *
 * The flag wins when the caller gives one; otherwise the presence of that file decides, and its
 * contents decide whether catalogs are in use. Both readings are of the working directory, like
 * the gitignore handling.
 */
function pnpmModule(
  option: Options['pnpm'],
  defaults: { isInEditor: boolean, stylistic: boolean },
): ConfigObject[] {
  if (option === false) {
    return []
  }

  const workspace = findPnpmWorkspace()
  if (option === undefined && !workspace) {
    return []
  }

  const moduleOptions: PnpmOptions = typeof option === 'object' && option !== null ? option : {}
  return pnpm({
    catalogs: workspace?.hasCatalogs ?? false,
    stylistic: defaults.stylistic,
    ...moduleOptions,
    isInEditor: moduleOptions.isInEditor ?? defaults.isInEditor,
  })
}

interface PnpmWorkspace {
  /** Whether the file declares a `catalog:` or `catalogs:` block. */
  hasCatalogs: boolean
}

/**
 * The nearest `pnpm-workspace.yaml`, walking up from the working directory.
 *
 * Upstream reads the same file at config-build time; the Module can only be enabled where the
 * project declares a pnpm workspace.
 */
function findPnpmWorkspace(): PnpmWorkspace | undefined {
  const root = parse(process.cwd()).root
  let directory = process.cwd()

  for (;;) {
    const candidate = join(directory, 'pnpm-workspace.yaml')
    if (existsSync(candidate)) {
      const contents = readFileSync(candidate, 'utf8')
      return { hasCatalogs: contents.includes('catalog:') || contents.includes('catalogs:') }
    }
    if (directory === root) {
      return undefined
    }
    directory = dirname(directory)
  }
}

/** The object form of the `stylistic` option carries the Module's options; every other form is enablement. */
function stylisticOptions(option: Options['stylistic']): StylisticOptions {
  return typeof option === 'object' && option !== null ? option : {}
}

/**
 * Upstream enables the TypeScript Module when the project has `typescript` — or its native
 * preview — installed, since the Module is useless without one; an explicit flag wins either way.
 */
function isTypeScriptEnabled(option: Options['typescript']): boolean {
  if (option !== undefined) {
    return option !== false
  }
  return isPackageInstalled('typescript') || isPackageInstalled('@typescript/native-preview')
}

/**
 * Merges the caller's overrides into the Config objects they name.
 *
 * A key that is a Module id applies to every object of that Module, so a caller can change
 * one rule without restating the module; a key that is a Config object name
 * (`lumirelle/<tail>`) applies to exactly that object, and a name Source did not emit is an
 * error rather than a silent no-op.
 *
 * `rules` merge over the object's rules, while `files` and `ignores` replace its scope when
 * given, which is how a caller narrows or widens one module.
 */
function applyOverrides(configs: ConfigObject[], overrides: Options['overrides'] = {}): ConfigObject[] {
  const entries = Object.entries(overrides).filter((entry): entry is [string, Override] => entry[1] !== undefined)
  if (entries.length === 0) {
    return configs
  }

  assertKnownConfigNames(configs, entries.map(([key]) => key))

  return configs.map((config) => {
    const matching = entries.filter(([key]) => key.startsWith(CONFIG_NAME_PREFIX)
      ? config.name === key
      : config.module === key)
    if (matching.length === 0) {
      return config
    }

    const overridden: ConfigObject = { ...config }
    for (const [, override] of matching) {
      if (override.files) {
        overridden.files = override.files
      }
      if (override.ignores) {
        overridden.ignores = override.ignores
      }
      if (override.rules) {
        overridden.rules = { ...overridden.rules, ...override.rules }
      }
    }
    return overridden
  })
}

/** A Config object name in `overrides` must exist, because names are the public targeting key. */
function assertKnownConfigNames(configs: ConfigObject[], keys: string[]): void {
  const names = new Set(configs.map(config => config.name))
  const unknown = keys.filter(key => key.startsWith(CONFIG_NAME_PREFIX) && !names.has(key))
  if (unknown.length > 0) {
    throw new Error(
      `Unknown Config object in "overrides": ${unknown.map(key => `"${key}"`).join(', ')}. `
      + `Source emits ${[...names].map(name => `"${name}"`).join(', ')}.`,
    )
  }
}
