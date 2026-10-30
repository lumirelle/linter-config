import type { ESLint, Linter } from 'eslint'
import type { ConfigObject, Domain, Options, PluginId, PluginRef, ProcessorRef } from '../types'
import { FlatConfigComposer } from 'eslint-flat-config-utils'
import { mergeProcessors, processorPassThrough } from 'eslint-merge-processors'
import { bridgeObjects, isBridgeEnabled, renameBridge } from '../bridge'
import { GLOB_MARKDOWN } from '../globs'
import { pluginDefinition } from '../plugins'
import { source } from '../source'

const ESLINT_DOMAINS: readonly Domain[] = [
  'js',
  'vue',
  'svelte',
  'astro',
  'angular',
  'data',
  'markup',
]

const BUNDLE_PACKAGE = '@lumirelle/linter-plugins-eslint'

/**
 * Turns Source into the ESLint Emission: filter by Domain, resolve Plugin ids to plugin
 * objects, fold shared fields into `languageOptions` / `linterOptions` / `processor`, and
 * hand the result to a `FlatConfigComposer`.
 *
 * With {@link Options.oxlint} set, the Bridge closes the Emission: it turns off the rules the
 * Oxlint Emission reports, computed from the same Config objects, so its `off` entries win over
 * every Module's severity in the same scope.
 */
export function composeEslint(options: Options): FlatConfigComposer<Linter.Config, string> {
  const configs = source(options)
  const composed = new FlatConfigComposer<Linter.Config, string>(
    ...configs
      .filter(config => ESLINT_DOMAINS.includes(config.domain))
      .map(async config => toEslintConfig(config)),
  )
  // The Bridge closes the Emission instead of joining it: a resolution hook runs after every
  // consumer `append` / `insertAfter` / `override`, so "last" stops being theirs to take away. It
  // is derived here, once, from the Config objects this call already built.
  const bridge = isBridgeEnabled(options.oxlint) ? bridgeObjects(configs, options) : undefined
  const composer = bridge
    ? composed.onResolved(resolved => [...resolved, ...renameBridge(bridge, resolved)])
    : composed

  // Markdown has its own `SourceCode`, which lacks the JS-only methods (`getAllComments`, ...) that
  // an unscoped rule can call; Upstream keeps every such rule off `.md` files the same way.
  if (options.markdown !== false) {
    return composer.setDefaultIgnores(previous => [...previous, GLOB_MARKDOWN])
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
  const nestedParser = await resolveNestedParser(languageOptions)
  const eslintConfig = {
    ...shared,
    ...(tools?.eslint?.language ? { language: tools.eslint.language } : {}),
    ...(Object.keys(languageOptions).length > 0 ? { languageOptions: nestedParser } : {}),
    ...(tools?.eslint?.linterOptions ? { linterOptions: tools.eslint.linterOptions } : {}),
    ...(tools?.eslint?.processor ? { processor: await loadProcessor(tools.eslint.processor) } : {}),
    ...(plugins ? { plugins: await resolvePlugins(plugins) } : {}),
  } as Linter.Config

  return eslintConfig
}

async function resolvePlugins(
  plugins: NonNullable<ConfigObject['plugins']>,
): Promise<Record<string, ESLint.Plugin>> {
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
  } catch (cause) {
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
    throw new Error(
      `The "${id}" plugin registers no parser, so a Config object cannot ask it for one.`,
    )
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
    return interopDefault(await import(packageName)) as NonNullable<
      Linter.LanguageOptions['parser']
    >
  } catch (cause) {
    throw new Error(
      `Cannot resolve "${packageName}", which the "${id}" plugin needs. `
        + `Install it in your project.`,
      { cause },
    )
  }
}

/**
 * Resolves a processor Source named by Plugin id and registration name.
 *
 * A processor usually lives inside its plugin package rather than in a package of its own, so the
 * plugin the Config object already declares is what carries it. The rest are glue the Bundle builds
 * from the plugin plus a companion package (Vue's SFC block handling), keyed by the same pair.
 */
async function loadProcessor(ref: ProcessorRef): Promise<Linter.Config['processor']> {
  const id = ref.plugin as PluginId
  const plugin = await loadPlugin(id, ref.plugin)
  const processor: Linter.Config['processor'] | undefined = (
    plugin as { processors?: Record<string, Linter.Config['processor']> }
  ).processors?.[ref.name]
  if (!processor) {
    const glue = (await loadBundle()).processors[`${ref.plugin}/${ref.name}`]
    if (glue) {
      return glue(ref.options)
    }

    throw new Error(`The "${id}" plugin registers no "${ref.name}" processor.`)
  }

  if (!ref.passThrough) {
    return processor
  }
  // The pass-through half is an object processor; the pair merges into one object as well.
  return mergeProcessors([processor as Exclude<typeof processor, string>, processorPassThrough])
}

/**
 * Resolves the `parserOptions.parser` a component parser delegates its scripts to.
 *
 * `svelte-eslint-parser` and `astro-eslint-parser` read the script parser from that option, and
 * Source can only name it as a Plugin id, so the Adapter swaps the id for the parser object.
 */
async function resolveNestedParser(
  languageOptions: Linter.LanguageOptions,
): Promise<Linter.LanguageOptions> {
  const parserOptions = languageOptions.parserOptions
  const nested: unknown = parserOptions?.parser
  if (typeof nested !== 'string') {
    return languageOptions
  }

  return {
    ...languageOptions,
    parserOptions: { ...parserOptions, parser: await loadParser(nested as PluginRef) },
  }
}

/** What the Plugin Bundle forwards: plugin objects and parser modules, both keyed by Plugin id, plus processor glue. */
interface Bundle {
  plugins: Record<string, ESLint.Plugin>
  parsers: Record<string, Linter.LanguageOptions['parser']>
  processors: Record<string, (options?: Record<string, unknown>) => Linter.Config['processor']>
}

let bundle: Promise<Bundle> | undefined

/** Loads the Bundle once; a failed resolution is retried on the next call. */
async function loadBundle(): Promise<Bundle> {
  bundle ??= importBundle()
  return bundle
}

async function importBundle(): Promise<Bundle> {
  try {
    const loaded = (await import(BUNDLE_PACKAGE)) as {
      eslintPlugins?: Bundle['plugins']
      eslintParsers?: Bundle['parsers']
      eslintProcessors?: Bundle['processors']
    }
    return {
      plugins: loaded.eslintPlugins ?? {},
      parsers: loaded.eslintParsers ?? {},
      processors: loaded.eslintProcessors ?? {},
    }
  } catch (cause) {
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
    return module.default
  }
  return module
}
