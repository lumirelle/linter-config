import type { ESLint, Linter } from 'eslint'
import type { ConfigObject, Domain, Options, PluginId, PluginRef } from '../types'
import { FlatConfigComposer } from 'eslint-flat-config-utils'
import { pluginDefinition } from '../plugins'
import { source } from '../source'

const ESLINT_DOMAINS: readonly Domain[] = ['js', 'vue', 'svelte', 'astro', 'angular', 'data', 'markup']

const BUNDLE_PACKAGE = '@lumirelle/linter-plugins-eslint'

/**
 * Turns Source into the ESLint Emission: filter by Domain, resolve Plugin ids to plugin
 * objects, fold shared fields into `languageOptions` / `linterOptions` / `processor`, and
 * hand the result to a `FlatConfigComposer`.
 */
export function composeEslint(options: Options): FlatConfigComposer<Linter.Config, string> {
  return new FlatConfigComposer<Linter.Config, string>(
    ...source(options)
      .filter(config => ESLINT_DOMAINS.includes(config.domain))
      .map(async config => toEslintConfig(config)),
  )
}

async function toEslintConfig(config: ConfigObject): Promise<Linter.Config> {
  const { domain: _domain, module: _module, globals, plugins, tools, ...shared } = config
  // `globals` is `languageOptions.globals` in an ESLint config, not a language option of its own.
  const languageOptions = {
    ...tools?.eslint?.languageOptions,
    ...(globals ? { globals } : {}),
  } as Linter.LanguageOptions
  const eslintConfig = {
    ...shared,
    ...(tools?.eslint?.language ? { language: tools.eslint.language } : {}),
    ...(Object.keys(languageOptions).length > 0 ? { languageOptions } : {}),
    ...(tools?.eslint?.linterOptions ? { linterOptions: tools.eslint.linterOptions } : {}),
    ...(tools?.eslint?.processor === undefined ? {} : { processor: tools.eslint.processor as Linter.Config['processor'] }),
    ...(plugins ? { plugins: await resolvePlugins(plugins) } : {}),
  } as Linter.Config

  return eslintConfig
}

async function resolvePlugins(plugins: NonNullable<ConfigObject['plugins']>): Promise<Record<string, ESLint.Plugin>> {
  const resolved: Record<string, ESLint.Plugin> = {}
  for (const id of Object.keys(plugins) as PluginId[]) {
    const ref = plugins[id]
    if (ref) {
      resolved[ref] = await loadPlugin(id, ref)
    }
  }
  return resolved
}

/**
 * Plugin packages are loaded with a dynamic `import` because the Bundle is ESM and only
 * peer plugins may be CommonJS; both shapes resolve through the namespace's default export.
 */
async function loadPlugin(id: PluginId, ref: PluginRef): Promise<ESLint.Plugin> {
  const definition = pluginDefinition(id)
  if (definition.from === 'bundle') {
    const plugin = (await loadBundledPlugins())[ref]
    if (!plugin) {
      throw new Error(
        `"${BUNDLE_PACKAGE}" does not provide the "${id}" plugin. `
        + `Install a Bundle version that covers it, or drop the module that needs it.`,
      )
    }
    return plugin
  }

  try {
    return interopDefault(await import(definition.eslint.plugin)) as ESLint.Plugin
  }
  catch (cause) {
    throw new Error(
      `Cannot resolve "${definition.eslint.plugin}", which the "${id}" plugin needs. `
      + `Install it in your project.`,
      { cause },
    )
  }
}

let bundledPlugins: Promise<Record<string, ESLint.Plugin>> | undefined

/** Loads the Bundle once; a failed resolution is retried on the next call. */
function loadBundledPlugins(): Promise<Record<string, ESLint.Plugin>> {
  bundledPlugins ??= importBundle()
  return bundledPlugins
}

async function importBundle(): Promise<Record<string, ESLint.Plugin>> {
  try {
    const loaded = await import(BUNDLE_PACKAGE) as { eslintPlugins?: Record<string, ESLint.Plugin> }
    return loaded.eslintPlugins ?? {}
  }
  catch (cause) {
    bundledPlugins = undefined
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
