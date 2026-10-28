import { isAbsolute } from 'node:path'

/** Either path separator, because a specifier is a path as the machine that resolved it writes one. */
const SEPARATORS = /[\\/]/

/**
 * The package a Plugin specifier names, whichever spelling the Emission uses.
 *
 * A bare package name is the spelling a consumer installs and reads, so it stays as written. An
 * absolute path is where a Bundle put the package, and only the part after the last `node_modules`
 * is the package there: a store path reads `<store>/node_modules/<package>/dist/index.mjs`, so the
 * last one is the one the specifier points into, and a scoped package's name is its scope and name
 * together.
 */
export function pluginPackageName(specifier: string): string {
  if (!isAbsolute(specifier)) {
    return specifier
  }

  const segments = specifier.split(SEPARATORS)
  const store = segments.lastIndexOf('node_modules')
  if (store === -1) {
    return specifier
  }

  const [name = specifier, second = ''] = segments.slice(store + 1)
  return name.startsWith('@') && second ? `${name}/${second}` : name
}
