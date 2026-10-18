import type { Composer } from '@oxlint-flat-config/composer'
import type { FlatConfigItem } from 'oxlint-flat-config'
import type { ConfigObject, Domain, Options, RuleEntry, RuleKey } from '../types'
import { composer } from '@oxlint-flat-config/composer'
import { pluginDefinition, pluginIdOfRuleKey } from '../plugins'
import { source } from '../source'

const OXLINT_DOMAINS: readonly Domain[] = ['js', 'vue']

/**
 * Turns Source into the Oxlint Emission: keep the Domains Oxlint can read, drop the fields
 * it has no concept of (`plugins`, `languageOptions`, `linterOptions`, `processor`), map
 * rule prefixes onto built-in scopes or `jsPlugins` aliases, and hand the result to the
 * `oxlint-flat-config` composer.
 */
export function composeOxlint(options: Options): Composer {
  return composer(
    ...source(options)
      .filter(config => OXLINT_DOMAINS.includes(config.domain) && config.tools?.oxlint !== false)
      .map(config => toOxlintConfig(config)),
  )
}

function toOxlintConfig(config: ConfigObject): FlatConfigItem {
  const rules = mapRules(config.rules)
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

function mapRules(rules: ConfigObject['rules']): Partial<Record<string, RuleEntry>> | undefined {
  if (!rules) {
    return undefined
  }

  const mapped: Partial<Record<string, RuleEntry>> = {}
  for (const key of Object.keys(rules) as RuleKey[]) {
    const entry = rules[key]
    const mappedKey = mapRuleKey(key)
    if (entry !== undefined && mappedKey) {
      mapped[mappedKey] = entry
    }
  }
  return mapped
}

/** A rule key keeps its id prefix when Oxlint has a built-in scope or a jsPlugin alias for it. */
function mapRuleKey(key: RuleKey): string | undefined {
  const id = pluginIdOfRuleKey(key)
  if (!id) {
    return key
  }

  const oxlint = pluginDefinition(id).oxlint
  const prefix = oxlint?.builtin ?? oxlint?.alias
  if (!prefix) {
    return undefined
  }
  return `${prefix}/${key.slice(id.length + 1)}`
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
