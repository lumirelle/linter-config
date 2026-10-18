import { createRequire } from 'node:module'

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
    return false
  }
}
