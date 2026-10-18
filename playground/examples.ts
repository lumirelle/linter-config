import type { Options } from '@lumirelle/linter-config/eslint'
import type { Linter } from 'eslint'
import type { OxlintConfig } from 'oxlint'
import { existsSync } from 'node:fs'
import { readdir } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

/**
 * The directory holding one example per subdirectory.
 *
 * This module lives in `playground/`, so the registry never needs a hand-maintained list: a later
 * ticket adds an example by adding its directory.
 */
const PLAYGROUND_DIRECTORY = dirname(fileURLToPath(import.meta.url))

/** An example as the runner and the integration tests consume it. */
export interface Example {
  /** The directory name under `playground/`; what `mise run play` takes. */
  name: string
  /** Absolute path of the example package. */
  directory: string
  /** The one options module both config modules read. */
  options: Options
  /** The ESLint Emission, awaited from the example's `eslint.config.js` default export. */
  eslint: readonly Linter.Config[]
  /** The Oxlint Emission, awaited from the example's `oxlint.config.ts` default export. */
  oxlint: OxlintConfig
}

/**
 * Every example name, sorted.
 *
 * An example is a directory under `playground/` with a `package.json`; nothing else here knows the
 * names, so the directory is the registration.
 */
export async function listExamples(): Promise<string[]> {
  const entries = await readdir(PLAYGROUND_DIRECTORY, { withFileTypes: true })
  return entries
    .filter(entry => entry.isDirectory() && existsSync(join(PLAYGROUND_DIRECTORY, entry.name, 'package.json')))
    .map(entry => entry.name)
    .sort()
}

/**
 * Load one example's options module and both config modules.
 *
 * The config modules import the package's public `eslint` and `oxlint` subpaths, so resolving an
 * example doubles as an export smoke test: a broken export, a missing peer or a missing parser
 * throws here.
 *
 * @throws when no example has that name, naming every valid one
 */
export async function resolveExample(name: string): Promise<Example> {
  const names = await listExamples()
  if (!names.includes(name)) {
    throw new Error(`Unknown example "${name}". Valid examples: ${names.join(', ')}`)
  }

  const directory = join(PLAYGROUND_DIRECTORY, name)
  const { options } = await importModule<{ options: Options }>(join(directory, 'options.ts'))
  const [eslint, oxlint] = await Promise.all([
    importModule<{ default: PromiseLike<Linter.Config[]> }>(join(directory, 'eslint.config.js'))
      .then(module => module.default),
    importModule<{ default: PromiseLike<OxlintConfig> }>(join(directory, 'oxlint.config.ts'))
      .then(module => module.default),
  ])

  // Both factories are thenable, so a consumer's config exports them without a top-level await;
  // `Promise.all` is where the registry awaits them.
  return { name, directory, options, eslint, oxlint }
}

/** Import a module by file path, with the type the caller expects from it. */
async function importModule<T>(path: string): Promise<T> {
  return await import(pathToFileURL(path).href) as T
}
