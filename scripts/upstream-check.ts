import type { UpstreamPin } from './upstream-pin'
import { execFile } from 'node:child_process'
import process from 'node:process'
import { promisify } from 'node:util'
import { PIN_FILE, readInstalledVersion, readUpstreamPin } from './upstream-pin'

const execFileAsync = promisify(execFile)

/** What the repository actually has, as opposed to what `upstream/pin.json` pins. */
export interface UpstreamObservation {
  /** Tag at the submodule's `HEAD`; `undefined` when the submodule is not checked out. */
  submoduleTag: string | undefined
  /** Version of the installed npm package; `undefined` when it cannot be resolved. */
  installedVersion: string | undefined
}

export interface UpstreamCheckResult {
  exitCode: number
  mismatches: string[]
}

/**
 * Compares the submodule tag and the installed npm version with the pinned baseline.
 *
 * The result carries the exit code, so tests can assert the outcome without calling
 * `process.exit`; only a mismatch makes it non-zero.
 */
export function checkUpstreamPin(pin: UpstreamPin, observed: UpstreamObservation): UpstreamCheckResult {
  const mismatches: string[] = []

  if (observed.submoduleTag === undefined) {
    mismatches.push(`cannot read the tag of "${pin.submodule}"; run "git submodule update --init"`)
  }
  else if (observed.submoduleTag !== pin.tag) {
    mismatches.push(`submodule "${pin.submodule}" is checked out at ${observed.submoduleTag}, but ${PIN_FILE} pins ${pin.tag}`)
  }

  if (observed.installedVersion === undefined) {
    mismatches.push(`cannot resolve the installed "${pin.package}" package; run "nub install"`)
  }
  else if (observed.installedVersion !== pin.version) {
    mismatches.push(`installed "${pin.package}" is ${observed.installedVersion}, but ${PIN_FILE} pins ${pin.version}`)
  }

  return { exitCode: mismatches.length === 0 ? 0 : 1, mismatches }
}

/** Tag at the submodule's `HEAD`; `undefined` when git cannot describe it (missing or detached untagged checkout). */
export async function readSubmoduleTag(submodule: string): Promise<string | undefined> {
  try {
    const { stdout } = await execFileAsync('git', ['-C', submodule, 'describe', '--tags', '--exact-match', 'HEAD'])
    return stdout.trim() || undefined
  }
  catch {
    return undefined
  }
}

/** Runs the check against the working tree and returns the process exit code. */
export async function main(): Promise<number> {
  const pin = await readUpstreamPin()
  const [submoduleTag, installedVersion] = await Promise.all([
    readSubmoduleTag(pin.submodule),
    readInstalledVersion(pin.package),
  ])
  const { exitCode, mismatches } = checkUpstreamPin(pin, { submoduleTag, installedVersion })

  if (exitCode === 0) {
    process.stdout.write(`Upstream baseline matches: ${pin.package} ${pin.version} (${pin.tag})\n`)
  }
  else {
    for (const mismatch of mismatches) {
      process.stderr.write(`upstream:check: ${mismatch}\n`)
    }
  }

  return exitCode
}

if (import.meta.main) {
  process.exitCode = await main()
}
