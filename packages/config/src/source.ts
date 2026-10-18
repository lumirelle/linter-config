import type { ConfigObject, Glob, Options, StylisticOptions } from './types'
import { isInEditorEnv } from './editor'
import { assertGlobVocabulary } from './globs'
import { disables } from './modules/disables'
import { ignores } from './modules/ignores'
import { imports } from './modules/imports'
import { javascript } from './modules/javascript'
import { jsdoc } from './modules/jsdoc'
import { jsonc } from './modules/jsonc'
import { node } from './modules/node'
import { sortPackageJson, sortTsconfig } from './modules/sort'
import { stylistic } from './modules/stylistic'
import { isTestEnabled, test, testOverrides } from './modules/test'
import { toml } from './modules/toml'
import { typescript } from './modules/typescript'
import { unicorn } from './modules/unicorn'
import { yaml } from './modules/yaml'
import { isPackageInstalled } from './packages'
import { enabledRuleKeys } from './rules'

/** Config object names are `lumirelle/<tail>`; anything else is a Module id. */
const CONFIG_NAME_PREFIX = 'lumirelle/'

type Overrides = NonNullable<Options['overrides']>
type Override = NonNullable<Overrides[keyof Overrides]>

/**
 * Composes every Module into Source's Config objects; the only input to both Adapters.
 *
 * Modules (`src/modules/<module>.ts`) land ticket by ticket, so Source grows here while
 * both Emissions stay valid.
 */
export function source(options: Options = {}): ConfigObject[] {
  const isInEditor = options.isInEditor ?? isInEditorEnv()
  const stylisticSlices = isStylisticEnabled(options.stylistic)

  // `test` and `disables` turn off rules owned by the Modules above them, and derive that table
  // from what those Modules actually emit, so they compose after them.
  const composed: ConfigObject[] = [
    ...ignores(options),
    ...javascript({ isInEditor }),
    ...isTypeScriptEnabled(options.typescript) ? typescript(options) : [],
    ...options.node === false ? [] : node(),
    ...options.jsdoc === false ? [] : jsdoc({ stylistic: stylisticSlices }),
    ...options.imports === false ? [] : imports({ stylistic: stylisticSlices }),
    ...options.unicorn === false ? [] : unicorn(),
    ...isStylisticEnabled(options.stylistic) ? stylistic(stylisticOptions(options.stylistic)) : [],

    // The data Modules follow Upstream's factory: `jsonc` carries the two `sort` objects, and
    // `yaml`/`toml` come after them. All three are ESLint-only, because Oxlint has no parser hook.
    ...options.jsonc === false ? [] : [...jsonc({ stylistic: stylisticSlices }), ...sortPackageJson(), ...sortTsconfig()],
    ...options.yaml === false ? [] : yaml({ stylistic: stylisticSlices }),
    ...options.toml === false ? [] : toml({ stylistic: stylisticSlices }),
  ]

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
