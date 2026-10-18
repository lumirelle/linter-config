import { existsSync, readFileSync } from 'node:fs'
import { basename, dirname, join } from 'node:path'
import { builtinManifests, defineConfig } from 'taze'

function findBuiltinManifest(type) {
  const manifest = builtinManifests.find(m => m.type === type)
  if (!manifest)
    throw new Error(`taze: expected a built-in manifest of type "${type}"`)
  return manifest
}

const packageJsonManifest = findBuiltinManifest('package.json')
const bunWorkspaceManifest = findBuiltinManifest('bun-workspace')

/**
 * Nub declares workspace catalogs in `package.json` under `workspaces.catalog` /
 * `workspaces.catalogs` — the shape Bun uses — but marks ownership with
 * `nub.lock` instead of `bun.lock`, which is the marker taze gates its built-in
 * Bun catalog reader on. Claim such a `package.json` and reuse that reader,
 * passing the already-parsed `raw` so the catalog write and the package.json
 * write share one object instead of clobbering each other.
 *
 * @see https://nubjs.com/docs/install
 */
const nubWorkspaceManifest = {
  name: 'nub-workspace',
  type: 'nub-workspace',
  match(filepath) {
    if (basename(filepath) !== 'package.json')
      return false
    if (!existsSync(join(dirname(filepath), 'nub.lock')))
      return false
    try {
      const raw = JSON.parse(readFileSync(filepath, 'utf8'))
      return Boolean(raw?.workspaces?.catalog || raw?.workspaces?.catalogs)
    }
    catch {
      return false
    }
  },
  async load(relative, options, shouldUpdate) {
    const packages = await packageJsonManifest.load(relative, options, shouldUpdate)
    const raw = packages[0]?.raw
    if (!raw)
      return packages
    const catalogs = await bunWorkspaceManifest.load(relative, options, shouldUpdate, raw)
    return [...catalogs, ...packages]
  },
  // Writes are routed by `type` to the built-in package.json / bun-workspace writers.
  async write() {},
}

export default defineConfig({
  // Scan every workspace member, not just the root.
  recursive: true,
  write: true,
  interactive: true,
  maturityPeriod: 1,
  githubActions: false,
  manifests: [nubWorkspaceManifest],
})
