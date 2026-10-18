import type { ModuleId, PluginId } from './types'
import { createRequire } from 'node:module'
import { pluginDefinition } from './plugins'

const require = createRequire(import.meta.url)

/**
 * Upstream's `isPackageExists()`: whether the consumer's project has `name` installed.
 *
 * Resolution starts at this package, which sits inside the consumer's `node_modules`, so it walks
 * up into the consumer's own dependencies — the ones this package only knows as optional peers.
 */
export function isPackageInstalled(name: string): boolean {
  try {
    require.resolve(name)
    return true
  }
  catch {
    // A package that only publishes an ESM `import` condition has no `require` entry to resolve,
    // but it is installed all the same; the ESM resolver reads its `exports` map.
    return resolvesAsEsm(name)
  }
}

/** Whether the ESM resolver finds `name` from this package; only an unresolvable specifier is false. */
function resolvesAsEsm(name: string): boolean {
  try {
    import.meta.resolve(name)
    return true
  }
  catch {
    return false
  }
}

/**
 * The npm packages a Module needs the consumer to install: for each peer Plugin id, its ESLint
 * plugin and the parser that goes with it. Bundled ids are provided by the Plugin Bundle and are
 * never missing.
 */
export function peerPackages(ids: readonly PluginId[]): string[] {
  const packages = ids.flatMap((id) => {
    const definition = pluginDefinition(id)
    if (definition.from !== 'peer') {
      return []
    }
    return [definition.eslint.plugin, ...definition.eslint.parser ? [definition.eslint.parser] : []]
  })

  return [...new Set(packages)]
}

/**
 * Asserts that the project has the packages a Module's peer plugins need.
 *
 * Both Emissions compose from the same Source, so a Module is enabled or not before an Adapter
 * filters on Domain: asking for `svelte` with Oxlint alone still fails here rather than silently
 * linting nothing. The error names every missing package, because the fix is one install command
 * and a resolution failure at plugin-load time would name only the first one.
 */
export function requirePeerPackages(module: ModuleId, ids: readonly PluginId[]): void {
  const missing = peerPackages(ids).filter(name => !isPackageInstalled(name))
  if (missing.length === 0) {
    return
  }

  throw new Error(
    `The "${module}" Module needs ${missing.length === 1 ? 'a package' : 'packages'} this project has not installed: `
    + `${missing.map(name => `"${name}"`).join(', ')}.`
    + ` Install ${missing.length === 1 ? 'it' : 'them'} to enable the Module.`,
  )
}
