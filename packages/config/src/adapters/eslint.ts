import type { ESLint, Linter } from 'eslint'
import type { ConfigObject, Domain, Options, PluginId, PluginRef } from '../types'
import { createRequire } from 'node:module'
import { FlatConfigComposer } from 'eslint-flat-config-utils'
import { pluginDefinition } from '../plugins'
import { source } from '../source'

const ESLINT_DOMAINS: readonly Domain[] = ['js', 'vue', 'svelte', 'astro', 'angular', 'data', 'markup']

const BUNDLE_PACKAGE = '@lumirelle/linter-plugins-eslint'

const require = createRequire(import.meta.url)

/**
 * Turns Source into the ESLint Emission: filter by Domain, resolve Plugin ids to plugin
 * objects, fold shared fields into `languageOptions` / `linterOptions` / `processor`, and
 * hand the result to a `FlatConfigComposer`.
 */
export function composeEslint(options: Options): FlatConfigComposer<Linter.Config, string> {
  return new FlatConfigComposer<Linter.Config, string>(
    ...source(options)
      .filter(config => ESLINT_DOMAINS.includes(config.domain))
      .map(config => toEslintConfig(config)),
  )
}

function toEslintConfig(config: ConfigObject): Linter.Config {
  const { domain: _domain, module: _module, globals, plugins, tools, ...shared } = config
  const languageOptions = { ...tools?.eslint?.languageOptions, ...globals } as Linter.LanguageOptions
  const eslintConfig = {
    ...shared,
    ...(tools?.eslint?.language ? { language: tools.eslint.language } : {}),
    ...(Object.keys(languageOptions).length > 0 ? { languageOptions } : {}),
    ...(tools?.eslint?.linterOptions ? { linterOptions: tools.eslint.linterOptions } : {}),
    ...(tools?.eslint?.processor === undefined ? {} : { processor: tools.eslint.processor as Linter.Config['processor'] }),
    ...(plugins ? { plugins: resolvePlugins(plugins) } : {}),
  } as Linter.Config

  return eslintConfig
}

function resolvePlugins(plugins: NonNullable<ConfigObject['plugins']>): Record<string, ESLint.Plugin> {
  const resolved: Record<string, ESLint.Plugin> = {}
  for (const id of Object.keys(plugins) as PluginId[]) {
    const ref = plugins[id]
    if (ref) {
      resolved[ref] = loadPlugin(id, ref)
    }
  }
  return resolved
}

function loadPlugin(id: PluginId, ref: PluginRef): ESLint.Plugin {
  const definition = pluginDefinition(id)
  if (definition.from === 'bundle') {
    const plugin = loadBundledPlugins()[ref]
    if (!plugin) {
      throw new Error(
        `"${BUNDLE_PACKAGE}" does not provide the "${id}" plugin. `
        + `Install a Bundle version that covers it, or drop the module that needs it.`,
      )
    }
    return plugin
  }

  try {
    return interopDefault(require(definition.eslint.plugin)) as ESLint.Plugin
  }
  catch (cause) {
    throw new Error(
      `Cannot resolve "${definition.eslint.plugin}", which the "${id}" plugin needs. `
      + `Install it in your project.`,
      { cause },
    )
  }
}

let bundledPlugins: Record<string, ESLint.Plugin> | undefined

function loadBundledPlugins(): Record<string, ESLint.Plugin> {
  if (bundledPlugins) {
    return bundledPlugins
  }

  try {
    const loaded = require(BUNDLE_PACKAGE) as { eslintPlugins?: Record<string, ESLint.Plugin> }
    bundledPlugins = loaded.eslintPlugins ?? {}
    return bundledPlugins
  }
  catch (cause) {
    throw new Error(
      `Cannot resolve "${BUNDLE_PACKAGE}". Install it to use the bundled plugins: nub add -D ${BUNDLE_PACKAGE}`,
      { cause },
    )
  }
}

/** Plugin packages may be ESM namespaces or CJS modules; both expose the plugin as the default export. */
function interopDefault(module: unknown): unknown {
  if (typeof module === 'object' && module !== null && 'default' in module) {
    return (module as { default: unknown }).default
  }
  return module
}
