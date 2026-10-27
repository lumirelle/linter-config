import type { Options } from '@lumirelle/linter-config/eslint'
import type { Linter } from 'eslint'
import type { OxlintConfig } from 'oxlint'
import { existsSync } from 'node:fs'
import { readdir } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

/**
 * The directory holding the examples.
 *
 * This module lives in `playground/`, so the registry never needs a hand-maintained list: an
 * example is a directory with a `package.json`, in either of the two layouts the playground
 * accepts — `playground/<stack>` for the paired flavor a flat directory is, or
 * `playground/<flavor>/<stack>` once a stack ships one directory per flavor.
 */
const PLAYGROUND_DIRECTORY = dirname(fileURLToPath(import.meta.url))

/** The linter dimension of an example. */
export type Flavor = 'eslint' | 'oxlint' | 'eslint-oxlint'

/** Every flavor, in the order a stack's examples are resolved and printed. */
const FLAVORS: readonly Flavor[] = ['eslint', 'oxlint', 'eslint-oxlint']

/** The flavor a flat example directory is, since it ships both config modules. */
const PAIRED_FLAVOR: Flavor = 'eslint-oxlint'

/** One example directory, before its options and config modules are imported. */
interface ExampleLocation {
  flavor: Flavor
  stack: string
  directory: string
}

/** An example as the runner and the integration tests consume it. */
export interface Example {
  /** The example's public name, `<flavor>/<stack>`; what `mise run play` takes. */
  name: string
  /** The linter dimension of the example. */
  flavor: Flavor
  /** The technology snapshot the example demonstrates, shared by its three flavors. */
  stack: string
  /** Absolute path of the example package. */
  directory: string
  /** The one options module the example's config modules read. */
  options: Options
  /** The ESLint Emission, awaited from the example's `eslint.config.js`, when the flavor ships one. */
  eslint?: readonly Linter.Config[]
  /** The Oxlint Emission, awaited from the example's `oxlint.config.ts`, when the flavor ships one. */
  oxlint?: OxlintConfig
}

/**
 * Every stack the playground ships, sorted.
 *
 * A stack is the technology snapshot dimension of an example: it is the one name that groups the
 * flavors showing the same snapshot, and it is what `mise run play` expands into them.
 */
export async function listStacks(): Promise<string[]> {
  const locations = await discoverExamples()
  return [...new Set(locations.map(location => location.stack))].sort()
}

/**
 * Every example name, sorted.
 *
 * An example is a directory under `playground/`, either a flat one or one grouped by flavor;
 * nothing else here knows the names, so the directory is the registration.
 */
export async function listExamples(): Promise<string[]> {
  const locations = await discoverExamples()
  return locations.map(nameOf).sort()
}

/**
 * Load one example's options module and the config modules it ships.
 *
 * The config modules import the package's public `eslint` and `oxlint` subpaths, so resolving an
 * example doubles as an export smoke test: a broken export, a missing peer or a missing parser
 * throws here.
 *
 * A bare stack name is the pre-flavor spelling of an example name and resolves to that stack's
 * paired flavor; it goes away once every stack ships one directory per flavor.
 *
 * @throws when no example has that name, naming every valid one
 */
export async function resolveExample(name: string): Promise<Example> {
  const locations = await discoverExamples()
  const location = findByName(locations, name)
  if (!location) {
    throw unknownName(name, locations)
  }
  return load(location)
}

/**
 * One stack's examples, in flavor order.
 *
 * The runner prints a stack by resolving it, so a stack that ships three flavors prints three
 * blocks and one that has not been converted yet prints the one it has.
 *
 * @throws when no stack has that name, naming every valid one
 */
export async function resolveStack(stack: string): Promise<Example[]> {
  const locations = await discoverExamples()
  const matches = locations.filter(location => location.stack === stack)
  if (matches.length === 0) {
    throw unknownName(stack, locations)
  }
  const ordered = FLAVORS.flatMap(flavor => matches.filter(location => location.flavor === flavor))
  return Promise.all(ordered.map(load))
}

/** The example a name denotes: `<flavor>/<stack>`, or a bare stack name the runner also expands. */
function findByName(locations: ExampleLocation[], name: string): ExampleLocation | undefined {
  const slash = name.indexOf('/')
  if (slash === -1) {
    return locations.find(location => location.flavor === PAIRED_FLAVOR && location.stack === name)
  }
  const flavor = name.slice(0, slash)
  const stack = name.slice(slash + 1)
  return locations.find(location => location.flavor === flavor && location.stack === stack)
}

/**
 * Every example directory, in both layouts.
 *
 * `node_modules` is skipped wherever it appears: every example has one, and it holds package
 * manifests of its own. A directory that holds examples but is not named after a flavor is a
 * mistake rather than a layout, so it fails instead of registering nothing.
 */
async function discoverExamples(): Promise<ExampleLocation[]> {
  const locations: ExampleLocation[] = []
  for (const entry of await exampleDirectories(PLAYGROUND_DIRECTORY)) {
    const directory = join(PLAYGROUND_DIRECTORY, entry)
    if (existsSync(join(directory, 'package.json'))) {
      locations.push({ flavor: PAIRED_FLAVOR, stack: entry, directory })
      continue
    }

    const nested = await exampleDirectories(directory)
    if (nested.length === 0) {
      continue
    }
    const flavor = FLAVORS.find(candidate => candidate === entry)
    if (!flavor) {
      throw new Error(
        `Unknown flavor "${entry}" under playground/. Valid flavors: ${FLAVORS.join(', ')}`,
      )
    }
    for (const stack of nested) {
      const stackDirectory = join(directory, stack)
      if (existsSync(join(stackDirectory, 'package.json'))) {
        locations.push({ flavor, stack, directory: stackDirectory })
      }
    }
  }
  return locations
}

/** The directories under `directory`, skipping the install artifacts every example carries. */
async function exampleDirectories(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true })
  return entries.filter(entry => entry.isDirectory() && entry.name !== 'node_modules').map(entry => entry.name)
}

/** Load one location's options module and the config modules its flavor ships. */
async function load(location: ExampleLocation): Promise<Example> {
  const { directory, flavor, stack } = location
  const [{ options }, eslint, oxlint] = await Promise.all([
    importModule<{ options: Options }>(join(directory, 'options.ts')),
    optionalEmission<readonly Linter.Config[]>(join(directory, 'eslint.config.js')),
    optionalEmission<OxlintConfig>(join(directory, 'oxlint.config.ts')),
  ])

  return {
    name: nameOf(location),
    flavor,
    stack,
    directory,
    options,
    // Only the Emission the flavor ships is present: a caller that needs one asks for the flavor
    // that has it instead of narrowing afterwards.
    ...(eslint ? { eslint } : {}),
    ...(oxlint ? { oxlint } : {}),
  }
}

/** An example's public name. */
function nameOf(location: ExampleLocation): string {
  return `${location.flavor}/${location.stack}`
}

/**
 * The failure for a name the playground does not ship.
 *
 * A caller may have meant a stack, which the runner expands into its flavors, or one example; the
 * message names both, so a typo never reads as an empty vocabulary.
 */
function unknownName(name: string, locations: ExampleLocation[]): Error {
  const stacks = [...new Set(locations.map(location => location.stack))].sort()
  const examples = locations.map(nameOf).sort()
  return new Error(
    `Unknown example "${name}". Valid stacks: ${stacks.join(', ')}. Valid examples: ${examples.join(', ')}`,
  )
}

/**
 * The Emission a config module default-exports, or nothing when the flavor ships no such module.
 *
 * Both factories are thenable, so a consumer's config exports them without a top-level await; this
 * is where the registry awaits them.
 */
async function optionalEmission<T>(path: string): Promise<T | undefined> {
  if (!existsSync(path)) {
    return undefined
  }
  const module = await importModule<{ default: PromiseLike<T> }>(path)
  return module.default
}

/** Import a module by file path, with the type the caller expects from it. */
async function importModule<T>(path: string): Promise<T> {
  return await import(pathToFileURL(path).href) as T
}
