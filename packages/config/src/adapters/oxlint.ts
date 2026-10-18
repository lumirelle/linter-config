import type { Composer } from '@oxlint-flat-config/composer'
import type { FlatConfigItem } from 'oxlint-flat-config'
import type { ConfigObject, Domain, Options, OxlintOptions, RuleKey } from '../types'
import { composer } from '@oxlint-flat-config/composer'
import { mapRules } from '../oxlint/rule-map'
import { pluginDefinition, pluginIdOfRuleKey } from '../plugins'
import { source } from '../source'

const OXLINT_DOMAINS: readonly Domain[] = ['js', 'vue']

/** Oxlint-only Config object name for the root `options` field, which has no ESLint counterpart. */
const OXLINT_OPTIONS_NAME = 'lumirelle/oxlint/options'

/**
 * Turns Source into the Oxlint Emission: keep the Domains Oxlint can read, drop the fields
 * it has no concept of (`plugins`, `languageOptions`, `linterOptions`, `processor`), map
 * rule prefixes onto built-in scopes or `jsPlugins` aliases, and hand the result to the
 * `oxlint-flat-config` composer.
 */
export function composeOxlint(options: Options): Composer {
  const rootOptions = oxlintRootOptions(options.oxlint)
  const typeAware = rootOptions?.typeAware === true

  const items: FlatConfigItem[] = source(options)
    .filter(config => OXLINT_DOMAINS.includes(config.domain) && config.tools?.oxlint !== false)
    .map(config => toOxlintConfig(config, { typeAware }))

  if (rootOptions) {
    // Oxlint reads `typeAware` / `typeCheck` only in the root config, so the object carries no `files`.
    items.push({ name: OXLINT_OPTIONS_NAME, options: rootOptions })
  }

  return composer(...items)
}

function toOxlintConfig(config: ConfigObject, mapping: { typeAware: boolean }): FlatConfigItem {
  const { rules } = mapRules(config.rules, mapping)
  const jsPlugins = jsPluginsFor(config.rules)
  const oxlintTools = config.tools?.oxlint === false ? undefined : config.tools?.oxlint

  // `oxlint-flat-config` models scopes more strictly than Source does (an object with
  // `ignores` may not carry rules); the composer resolves what it receives.
  const fields: Record<string, unknown> = {
    name: config.name,
    ...(rules ? { rules } : {}),
    ...(jsPlugins ? { jsPlugins } : {}),
    ...(oxlintTools?.env ? { env: oxlintTools.env } : {}),
    ...(config.globals ? { globals: mapGlobals(config.globals) } : {}),
    ...(config.settings ? { settings: config.settings } : {}),
  }

  if (config.files) {
    fields.files = config.files
  }
  if (config.ignores) {
    fields.ignores = config.ignores
  }
  return fields as FlatConfigItem
}

/** `options.oxlint` is the Bridge flag in its boolean form and Oxlint's root options in its object form. */
function oxlintRootOptions(option: Options['oxlint']): OxlintOptions | undefined {
  if (typeof option !== 'object' || option === null) {
    return undefined
  }

  const { typeAware, typeCheck } = option
  const root: OxlintOptions = {
    ...(typeAware === undefined ? {} : { typeAware }),
    ...(typeCheck === undefined ? {} : { typeCheck }),
  }
  return Object.keys(root).length > 0 ? root : undefined
}

function jsPluginsFor(rules: ConfigObject['rules']): Array<{ name: string, specifier: string }> | undefined {
  if (!rules) {
    return undefined
  }

  const ids = new Set((Object.keys(rules) as RuleKey[]).map(key => pluginIdOfRuleKey(key)))
  const entries: Array<{ name: string, specifier: string }> = []
  for (const id of ids) {
    const oxlint = id ? pluginDefinition(id).oxlint : undefined
    if (oxlint?.alias && oxlint.jsPlugin) {
      entries.push({ name: oxlint.alias, specifier: oxlint.jsPlugin })
    }
  }
  return entries.length > 0 ? entries : undefined
}

/** ESLint declares a global read-only or writable with a boolean; Oxlint spells the same thing out. */
function mapGlobals(globals: Record<string, boolean>): Record<string, 'readonly' | 'writable'> {
  return Object.fromEntries(
    Object.entries(globals).map(([name, readonly]) => [name, readonly ? 'readonly' : 'writable']),
  )
}
