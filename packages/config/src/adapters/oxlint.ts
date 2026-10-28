import type { Composer } from '@oxlint-flat-config/composer'
import type { FlatConfigItem } from 'oxlint-flat-config'
import type { RuleMapping } from '../oxlint/rule-map'
import type { ConfigObject, Options, PluginId } from '../types'
import { composer } from '@oxlint-flat-config/composer'
import { isOxlintConfig } from '../oxlint/domains'
import { isTypeAware, oxlintRootOptions } from '../oxlint/options'
import { mapRules } from '../oxlint/rule-map'
import { PLUGIN_IDS, pluginDefinition } from '../plugins'
import { source } from '../source'

/** Oxlint-only Config object name for the root `options` field, which has no ESLint counterpart. */
const OXLINT_OPTIONS_NAME = 'lumirelle/oxlint/options'

/** Oxlint-only Config object name for the single `jsPlugins` declaration of an Emission. */
const OXLINT_JSPLUGINS_NAME = 'lumirelle/oxlint/jsPlugins'

const BUNDLE_PACKAGE = '@lumirelle/linter-plugins-oxlint'

/** What the Bundle exports for resolving a Plugin id, when that Bundle version provides it. */
interface Bundle {
  resolveJsPlugin?: (id: string) => string | undefined
}

let bundle: Promise<Bundle> | undefined

/**
 * Fails at factory time, not at ESM-resolution time, when the Bundle is not installed.
 *
 * `import.meta.resolve` follows the `import` condition the Bundle publishes, which is why
 * `createRequire().resolve` cannot see it.
 */
function requireBundle(): void {
  try {
    import.meta.resolve(BUNDLE_PACKAGE)
  }
  catch (cause) {
    throw bundleError(cause)
  }
}

/** The one install error naming the Bundle, whichever step failed to reach it. */
function bundleError(cause: unknown): Error {
  return new Error(`Cannot resolve "${BUNDLE_PACKAGE}". Install it in your project.`, { cause })
}

/** Loads the Bundle once; a failed load is retried on the next call. */
function loadBundle(): Promise<Bundle> {
  bundle ??= import(BUNDLE_PACKAGE).then(
    loaded => loaded as Bundle,
    (cause) => {
      bundle = undefined
      throw bundleError(cause)
    },
  )
  return bundle
}

/**
 * Turns Source into the Oxlint Emission: keep the Domains Oxlint can read, drop the fields
 * it has no concept of (`plugins`, `languageOptions`, `linterOptions`, `processor`), map
 * rule prefixes onto built-in scopes or `jsPlugins` aliases, and hand the result to the
 * `oxlint-flat-config` composer.
 */
export function composeOxlint(options: Options): Composer {
  requireBundle()
  const rootOptions = oxlintRootOptions(options.oxlint)
  const typeAware = isTypeAware(options)

  const declared = new Set<PluginId>()
  const items: Array<FlatConfigItem | Promise<FlatConfigItem | undefined>> = source(options)
    .filter(config => isOxlintConfig(config))
    .map((config) => {
      const mapping = mapRules(config.rules, { typeAware })
      for (const id of mapping.jsPlugins) {
        declared.add(id)
      }
      return toOxlintConfig(config, mapping)
    })

  items.unshift(jsPluginsDeclaration(declared))

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
  return fields
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
async function jsPluginsDeclaration(ids: ReadonlySet<PluginId>): Promise<FlatConfigItem | undefined> {
  const relevant = PLUGIN_IDS.filter((id) => {
    const oxlint = pluginDefinition(id).oxlint
    return ids.has(id) && oxlint?.alias && oxlint.jsPlugin
  })
  if (relevant.length === 0) {
    return undefined
  }

  const { resolveJsPlugin } = await loadBundle()
  const entries = relevant.map((id) => {
    const oxlint = pluginDefinition(id).oxlint as { alias: string, jsPlugin: string }
    // One rule: a package the Bundle ships is a resolved absolute path, anything else stays the
    // bare name for the consumer to install.
    return { name: oxlint.alias, specifier: resolveJsPlugin?.(id) ?? oxlint.jsPlugin }
  })

  return { name: OXLINT_JSPLUGINS_NAME, jsPlugins: entries }
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
