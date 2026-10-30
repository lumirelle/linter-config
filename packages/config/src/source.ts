import type { ConfigObject, Glob, Options, PnpmOptions } from './types'
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

export const CONFIG_NAME_PREFIX = 'lumirelle/'

type Overrides = NonNullable<Options['overrides']>
type Override = NonNullable<Overrides[keyof Overrides]>

/**
 * Composes every Module into Source's Config objects; the only input to both Adapters.
 *
 * The order below is the emission order both Adapters preserve.
 */
export function source(options: Options = {}): ConfigObject[] {
  const isInEditor = options.isInEditor ?? isInEditorEnv()
  const perfectionistEnabled = options.perfectionist !== false
  const jsxEnabled = !!options.jsx
  const typescriptEnabled = isTypeScriptEnabled(options.typescript)
  // Treats `.vue` as one more component extension of the TypeScript Module, so the
  // component parser's scripts are typed whenever `vue` is on.
  const componentExts = [...(options.componentExts ?? []), ...(options.vue ? ['vue'] : [])]
  const nodeEnabled = options.node !== false
  const jsdocEnabled = options.jsdoc !== false
  const importsEnabled = options.imports !== false
  const e18eEnabled = options.e18e !== false
  const unicornEnabled = options.unicorn !== false
  const antislopEnabled = options.antislop === true
  const stylisticOptions = options.stylistic
  const stylisticEnabled = isStylisticEnabled(stylisticOptions)
  const regexEnabled = options.regexp !== false
  const vueEnabled = !!options.vue
  const reactEnabled = !!options.react
  const nextjsEnabled = !!options.nextjs
  const solidEnabled = !!options.solid
  const svelteEnabled = !!options.svelte
  const unocssEnabled = !!options.unocss
  const astroEnabled = !!options.astro
  const angularEnabled = !!options.angular
  const composed: ConfigObject[] = [
    ...ignores(options),
    ...javascript({ isInEditor }),
    ...eslintComments(),
    ...command(),
    ...(perfectionistEnabled ? perfectionist() : []),
    ...(jsxEnabled ? jsx() : []),
    ...(typescriptEnabled ? typescript({ ...options, componentExts }) : []),
    ...(nodeEnabled ? node() : []),
    ...(jsdocEnabled ? jsdoc({ stylistic: stylisticEnabled }) : []),
    ...(importsEnabled ? imports({ stylistic: stylisticEnabled }) : []),
    ...(e18eEnabled ? e18e({ isInEditor, type: options.type }) : []),
    ...(unicornEnabled ? unicorn() : []),
    ...(antislopEnabled ? antislop() : []),
    ...(stylisticEnabled
      ? stylistic(
          typeof stylisticOptions === 'object' && stylisticOptions !== null ? stylisticOptions : {},
        )
      : []),
    ...(regexEnabled ? regexp() : []),
    ...(vueEnabled ? vue({ ...options, componentExts, typescript: typescriptEnabled }) : []),
    ...(reactEnabled ? react(options) : []),
    ...(nextjsEnabled ? nextjs() : []),
    ...(solidEnabled ? solid(options) : []),
    ...(svelteEnabled ? svelte({ ...options, stylistic: stylisticEnabled }) : []),
    ...(unocssEnabled ? unocss() : []),
    ...(astroEnabled ? astro({ stylistic: stylisticEnabled }) : []),
    ...(angularEnabled ? angular() : []),
  ]

  const jsoncEnabled = options.jsonc !== false
  const yamlEnabled = options.yaml !== false
  const tomlEnabled = options.toml !== false
  // Some modules switch rules off read what the earlier Modules actually enabled, which is why they are composed seperately.
  composed.push(
    ...(jsoncEnabled
      ? [...jsonc({ stylistic: stylisticEnabled }), ...sortPackageJson(), ...sortTsconfig()]
      : []),
    ...pnpmModule(options.pnpm, { isInEditor, stylistic: stylisticEnabled }),
    ...(yamlEnabled ? yaml({ stylistic: stylisticEnabled }) : []),
    ...(tomlEnabled ? toml({ stylistic: stylisticEnabled }) : []),
    ...formattersModule(options.formatters),
  )

  const markdownEnabled = options.markdown !== false
  if (markdownEnabled) {
    composed.push(
      ...markdown({ componentExts: options.componentExts, enabled: enabledRuleKeys(composed) }),
    )
  }

  const testEnabled = isTestEnabled(options.test)
  if (testEnabled) {
    composed.push(
      ...test({
        enabled: enabledRuleKeys(composed),
        isInEditor,
        overrides: testOverrides(options.test),
      }),
    )
  }

  const configs = applyOverrides([...composed, ...disables(composed)], options.overrides)

  // Invariant: a glob must work in both tools, so Source rejects anything outside the
  // shared vocabulary before an Adapter ever sees it.
  assertGlobVocabulary(
    configs.flatMap(config => [...(config.files ?? []), ...(config.ignores ?? [])] as Glob[]),
  )

  return configs
}
function isStylisticEnabled(option: Options['stylistic']): boolean {
  return option !== undefined && option !== false
}
function isTypeScriptEnabled(option: Options['typescript']): boolean {
  if (option !== undefined) {
    return option !== false
  }
  return isPackageInstalled('typescript') || isPackageInstalled('@typescript/native-preview')
}
/**
 * Provide formatters module by user options.
 */
function formattersModule(option: Options['formatters']): ConfigObject[] {
  if (!option) {
    return []
  }
  return formatters(
    option === true ? { css: true, graphql: true, html: true, markdown: true } : option,
  )
}
/**
 * Provide PNPM module by user options.
 */
function pnpmModule(
  option: Options['pnpm'],
  defaults: { isInEditor: boolean; stylistic: boolean },
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
 * Find the nearest `pnpm-workspace.yaml`, walking up from the working directory.
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

/**
 * Merges the caller's overrides into the Config objects they name.
 *
 * A key that is a Module id applies to every object of that Module, so a caller can change
 * one rule without restating the module; a key that is a Config object name
 * (`lumirelle/{tail}`) applies to exactly that object, and a name Source did not emit is an
 * error rather than a silent no-op.
 *
 * `rules` merge over the object's rules, while `files` and `ignores` replace its scope when
 * given, which is how a caller narrows or widens one module.
 */
function applyOverrides(
  configs: ConfigObject[],
  overrides: Options['overrides'] = {},
): ConfigObject[] {
  const entries = Object.entries(overrides).filter(
    (entry): entry is [string, Override] => entry[1] !== undefined,
  )
  if (entries.length === 0) {
    return configs
  }

  assertKnownConfigNames(
    configs,
    entries.map(([key]) => key),
  )

  return configs.map(config => {
    const matching = entries.filter(([key]) =>
      key.startsWith(CONFIG_NAME_PREFIX) ? config.name === key : config.module === key,
    )
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
