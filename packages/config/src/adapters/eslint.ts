import type { ESLint, Linter } from 'eslint'
import type { ConfigObject, Domain, Options, PluginId, PluginRef } from '../types'
import { FlatConfigComposer } from 'eslint-flat-config-utils'
import { mergeProcessors, processorPassThrough } from 'eslint-merge-processors'
import { GLOB_MARKDOWN } from '../globs'
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
  const composer = new FlatConfigComposer<Linter.Config, string>(
    ...source(options)
      .filter(config => ESLINT_DOMAINS.includes(config.domain))
      .map(async config => toEslintConfig(config)),
  )

  // Markdown has its own `SourceCode`, which lacks the JS-only methods (`getAllComments`, ...) that
  // an unscoped rule can call; Upstream keeps every such rule off `.md` files the same way.
  if (options.markdown !== false) {
    composer.setDefaultIgnores(previous => [...previous, GLOB_MARKDOWN])
  }

  return composer
}

async function toEslintConfig(config: ConfigObject): Promise<Linter.Config> {
  const { domain: _domain, module: _module, globals, plugins, tools, ...shared } = config
  // `globals` is `languageOptions.globals` in an ESLint config, not a language option of its own.
  const languageOptions = {
    ...tools?.eslint?.languageOptions,
    ...(globals ? { globals } : {}),
    ...(tools?.eslint?.parser ? { parser: await loadParser(tools.eslint.parser) } : {}),
  } as Linter.LanguageOptions
  const eslintConfig = {
    ...shared,
    ...(tools?.eslint?.language ? { language: tools.eslint.language } : {}),
    ...(Object.keys(languageOptions).length > 0 ? { languageOptions } : {}),
    ...(tools?.eslint?.linterOptions ? { linterOptions: tools.eslint.linterOptions } : {}),
    ...(tools?.eslint?.processor === undefined ? {} : { processor: tools.eslint.processor as Linter.Config['processor'] }),
    ...(tools?.eslint?.processorMerge ? { processor: await loadMergedProcessor(tools.eslint.processorMerge) } : {}),
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
    const plugin = (await loadBundle()).plugins[ref]
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

/**
 * Resolves the parser a Config object asks the Plugin id for.
 *
 * A bundled id is served by the Bundle, the same way its plugin is; a peer id falls back to
 * the consumer's own copy of the registry's parser package.
 */
async function loadParser(ref: PluginRef): Promise<NonNullable<Linter.LanguageOptions['parser']>> {
  const id = ref as PluginId
  const definition = pluginDefinition(id)
  const packageName = definition.eslint.parser
  if (!packageName) {
    throw new Error(`The "${id}" plugin registers no parser, so a Config object cannot ask it for one.`)
  }

  if (definition.from === 'bundle') {
    const parser = (await loadBundle()).parsers[id]
    if (!parser) {
      throw new Error(
        `"${BUNDLE_PACKAGE}" does not provide the "${id}" parser. `
        + `Install a Bundle version that covers it, or drop the module that needs it.`,
      )
    }
    return parser
  }

  try {
    return interopDefault(await import(packageName)) as NonNullable<Linter.LanguageOptions['parser']>
  }
  catch (cause) {
    throw new Error(
      `Cannot resolve "${packageName}", which the "${id}" plugin needs. `
      + `Install it in your project.`,
      { cause },
    )
  }
}

/**
 * Builds the merged processor a Config object asks for: the Plugin id's own processor, plus a
 * pass-through so the document itself is linted alongside the blocks the processor extracts.
 */
async function loadMergedProcessor(
  merge: { plugin: PluginRef, name: string },
): Promise<NonNullable<Linter.Config['processor']>> {
  const id = merge.plugin as PluginId
  const plugin = await loadPlugin(id, merge.plugin)
  const processor = plugin.processors?.[merge.name]
  if (!processor) {
    throw new Error(`The "${id}" plugin registers no "${merge.name}" processor.`)
  }
  return mergeProcessors([processor, processorPassThrough])
}

/** What the Plugin Bundle forwards: plugin objects and parser modules, both keyed by Plugin id. */interface Bundle {
  plugins: Record<string, ESLint.Plugin>
  parsers: Record<string, Linter.LanguageOptions['parser']>
}

let bundle: Promise<Bundle> | undefined

/** Loads the Bundle once; a failed resolution is retried on the next call. */
function loadBundle(): Promise<Bundle> {
  bundle ??= importBundle()
  return bundle
}

async function importBundle(): Promise<Bundle> {
  try {
    const loaded = await import(BUNDLE_PACKAGE) as { eslintPlugins?: Bundle['plugins'], eslintParsers?: Bundle['parsers'] }
    return { plugins: loaded.eslintPlugins ?? {}, parsers: loaded.eslintParsers ?? {} }
  }
  catch (cause) {
    bundle = undefined
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
