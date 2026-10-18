import { readFile } from 'node:fs/promises'
import { createRequire } from 'node:module'

/**
 * The Upstream baseline: the submodule tag and the exactly pinned npm package must name the
 * same release. `upstream/pin.json` is the single source of truth, and `upstream/README.md`
 * documents how to bump it.
 */
export interface UpstreamPin {
  package: string
  version: string
  tag: string
  submodule: string
}

/** Repository-relative path of the pin file, for messages. */
export const PIN_FILE = 'upstream/pin.json'

const PIN_URL = new URL(`../${PIN_FILE}`, import.meta.url)

/** Reads the pinned baseline from `upstream/pin.json`. */
export async function readUpstreamPin(): Promise<UpstreamPin> {
  return JSON.parse(await readFile(PIN_URL, 'utf8')) as UpstreamPin
}

/**
 * The version of the installed npm package, resolved from its manifest.
 *
 * Returns `undefined` instead of throwing when the package is not installed, so the check can
 * report a mismatch rather than crash.
 */
export async function readInstalledVersion(packageName: string): Promise<string | undefined> {
  try {
    const manifest = createRequire(import.meta.url).resolve(`${packageName}/package.json`)
    const { version } = JSON.parse(await readFile(manifest, 'utf8')) as { version: string }
    return version
  }
  catch {
    return undefined
  }
}
