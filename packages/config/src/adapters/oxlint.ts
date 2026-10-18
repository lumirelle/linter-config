import type { Composer } from '@oxlint-flat-config/composer'
import type { FlatConfigItem } from 'oxlint-flat-config'
import type { RuleMapping } from '../oxlint/rule-map'
import type { ConfigObject, Options, PluginId } from '../types'
import { composer } from '@oxlint-flat-config/composer'
import { isOxlintDomain } from '../oxlint/domains'
import { oxlintRootOptions } from '../oxlint/options'
import { mapRules } from '../oxlint/rule-map'
import { PLUGIN_IDS, pluginDefinition } from '../plugins'
import { source } from '../source'

/** Oxlint-only Config object name for the root `options` field, which has no ESLint counterpart. */
const OXLINT_OPTIONS_NAME = 'lumirelle/oxlint/options'

/** Oxlint-only Config object name for the single `jsPlugins` declaration of an Emission. */
const OXLINT_JSPLUGINS_NAME = 'lumirelle/oxlint/jsPlugins'

/**
 * Turns Source into the Oxlint Emission: keep the Domains Oxlint can read, drop the fields
 * it has no concept of (`plugins`, `languageOptions`, `linterOptions`, `processor`), map
 * rule prefixes onto built-in scopes or `jsPlugins` aliases, and hand the result to the
 * `oxlint-flat-config` composer.
 */
export function composeOxlint(options: Options): Composer {
  const rootOptions = oxlintRootOptions(options.oxlint)
  const typeAware = rootOptions?.typeAware === true

  const declared = new Set<PluginId>()
  const items: FlatConfigItem[] = source(options)
    .filter(config => isOxlintDomain(config.domain) && config.tools?.oxlint !== false)
    .map((config) => {
      const mapping = mapRules(config.rules, { typeAware })
      for (const id of mapping.jsPlugins) {
        declared.add(id)
      }
      return toOxlintConfig(config, mapping)
    })

  const jsPlugins = jsPluginsDeclaration(declared)
  if (jsPlugins) {
    items.unshift(jsPlugins)
  }

  if (rootOptions) {
    // Oxlint reads `typeAware` / `typeCheck` only in the root config, so the object carries no `files`.
    items.push({ name: OXLINT_OPTIONS_NAME, options: rootOptions })
  }

  return composer(...items)
}

function toOxlintConfig(config: ConfigObject, { rules }: RuleMapping): FlatConfigItem {
  const oxlintTools = config.tools?.oxlint === false ? undefined : config.tools?.oxlint

  // `oxlint-flat-config` models scopes more strictly than Source does (an object with
  // `ignores` may not carry rules); the composer resolves what it receives.
  const fields: Record<string, unknown> = {
    name: config.name,
    ...(rules ? { rules } : {}),
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

/**
 * The one `jsPlugins` declaration of an Emission: every Plugin id a surviving rule resolves
 * through, declared once, in registry order.
 *
 * Oxlint reads `jsPlugins` from an override too, so declaring per Config object would carry the
 * same alias several times — once per object that happens to use it — and leave it to Oxlint which
 * copy wins. One unscoped declaration covers every file. The object form is what a scoped package
 * requires, and the alias is the Plugin id, so a rule key reads the same in both Emissions.
 */
function jsPluginsDeclaration(ids: ReadonlySet<PluginId>): FlatConfigItem | undefined {
  const entries = PLUGIN_IDS.filter(id => ids.has(id)).flatMap((id) => {
    const oxlint = pluginDefinition(id).oxlint
    return oxlint?.alias && oxlint.jsPlugin ? [{ name: oxlint.alias, specifier: oxlint.jsPlugin }] : []
  })

  return entries.length > 0
    ? { name: OXLINT_JSPLUGINS_NAME, jsPlugins: entries }
    : undefined
}

/**
 * ESLint declares a global read-only or writable with a boolean (`true` = writable, the `globals`
 * package's convention); Oxlint spells the same thing out.
 */
function mapGlobals(globals: Record<string, boolean>): Record<string, 'readonly' | 'writable'> {
  return Object.fromEntries(
    Object.entries(globals).map(([name, writable]) => [name, writable ? 'writable' : 'readonly']),
  )
}
