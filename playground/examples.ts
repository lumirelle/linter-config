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
 * example is the directory `playground/<flavor>/<stack>` that carries a `package.json`.
 */
const PLAYGROUND_DIRECTORY = dirname(fileURLToPath(import.meta.url))

/** The linter dimension of an example. */
export type Flavor = 'eslint' | 'oxlint' | 'eslint-oxlint'

/** Every flavor, in the order a stack's examples are resolved and printed. */
const FLAVORS: readonly Flavor[] = ['eslint', 'oxlint', 'eslint-oxlint']

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
  /**
   * The options module the example ships, when it has one.
   *
   * Only the paired flavor keeps options in a module, because its two configs read one object. A
   * single-tool flavor writes the same options where it calls its one factory, as a consumer with
   * one tool does, so there is no module here to read.
   */
  options?: Options
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
  return stackNames(await discoverExamples())
}

/**
 * Every example name, sorted.
 *
 * The name is `<flavor>/<stack>`, and no list anywhere holds it: the directory is the registration,
 * so a stack that starts shipping a flavor needs no edit outside its own three directories.
 */
export async function listExamples(): Promise<string[]> {
  return exampleNames(await discoverExamples())
}

/**
 * Load one example's options module and the config modules it ships.
 *
 * The config modules import the package's public `eslint` and `oxlint` subpaths, so resolving an
 * example doubles as an export smoke test: a broken export, a missing peer or a missing parser
 * throws here.
 *
 * The name is `<flavor>/<stack>`. There is no bare-stack spelling: one stack is three examples, so
 * a name that leaves the flavor out names none of them.
 *
 * @throws when no example has that name, naming every valid one
 */
export async function resolveExample(name: string): Promise<Example> {
  const locations = await discoverExamples()
  const location = locations.find(candidate => nameOf(candidate) === name)
  if (!location) {
    throw unknownExample(name, locations)
  }
  return load(location)
}

/**
 * One stack's examples, in flavor order.
 *
 * The result is the flavors the stack ships, not a fixed three: every stack in the playground ships
 * all of them today, and a stack that lost a directory returns fewer, which
 * `test/examples/flavors.test.ts` turns into a failure rather than a shorter matrix row.
 *
 * @throws when no stack has that name, naming every valid one
 */
export async function resolveStack(stack: string): Promise<Example[]> {
  const locations = await discoverExamples()
  const matches = locations.filter(location => location.stack === stack)
  if (matches.length === 0) {
    throw unknownStack(stack, locations)
  }
  const ordered = FLAVORS.flatMap(flavor => matches.filter(location => location.flavor === flavor))
  return Promise.all(ordered.map(load))
}

/**
 * Every example directory.
 *
 * A flavor is the only directory `playground/` holds besides this registry and the runner, so a
 * directory that groups examples under any other name is a mistake rather than a layout, and it
 * fails instead of registering nothing. It fails only when it groups at least one example, though:
 * a directory that groups nothing is skipped, because a checkout that installed dependencies before
 * the flavor-first layout still holds `node_modules`-only directories where the flat examples used
 * to be, and those are install history rather than a layout the registry should reject. `node_modules`
 * is skipped wherever it appears: the playground root and every example carry install artifacts, and
 * they hold package manifests of their own.
 */
async function discoverExamples(): Promise<ExampleLocation[]> {
  const locations: ExampleLocation[] = []
  for (const entry of await exampleDirectories(PLAYGROUND_DIRECTORY)) {
    const flavor = FLAVORS.find(candidate => candidate === entry)
    const grouped = await exampleDirectories(join(PLAYGROUND_DIRECTORY, entry))
    if (!flavor) {
      if (grouped.length > 0) {
        throw new Error(
          `Unknown flavor "${entry}" under playground/. Valid flavors: ${FLAVORS.join(', ')}`,
        )
      }
      continue
    }

    const flavorDirectory = join(PLAYGROUND_DIRECTORY, entry)
    for (const stack of grouped) {
      const stackDirectory = join(flavorDirectory, stack)
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

/** Load one location's options module, when it ships one, and the config modules it ships. */
async function load(location: ExampleLocation): Promise<Example> {
  const { directory, flavor, stack } = location
  const [options, eslint, oxlint] = await Promise.all([
    optionalOptions(join(directory, 'options.ts')),
    optionalEmission<readonly Linter.Config[]>(join(directory, 'eslint.config.js')),
    optionalEmission<OxlintConfig>(join(directory, 'oxlint.config.ts')),
  ])

  return {
    name: nameOf(location),
    flavor,
    stack,
    directory,
    // Only what the flavor actually ships is present: a caller that needs one Emission asks for the
    // flavor that has it instead of narrowing afterwards.
    ...(options ? { options } : {}),
    ...(eslint ? { eslint } : {}),
    ...(oxlint ? { oxlint } : {}),
  }
}

/**
 * The options a paired example keeps in `options.ts`, or nothing when the flavor writes them inline.
 *
 * The module exists so two configs can read one object. A single-tool flavor has one config, so it
 * carries no module at all; the Emission relation in `test/examples/flavors.test.ts` is what proves
 * it was built from the stack's options.
 */
async function optionalOptions(path: string): Promise<Options | undefined> {
  if (!existsSync(path)) {
    return undefined
  }
  const module = await importModule<{ options: Options }>(path)
  return module.options
}

/** An example's public name. */
function nameOf(location: ExampleLocation): string {
  return `${location.flavor}/${location.stack}`
}

/**
 * Every stack name the locations group, sorted.
 *
 * The public stack list and the unknown-stack failure both read this, so the message cannot list a
 * stack the resolver would not accept.
 */
function stackNames(locations: readonly ExampleLocation[]): string[] {
  return [...new Set(locations.map(location => location.stack))].sort()
}

/**
 * Every example name the locations name, sorted.
 *
 * The public example list and the unknown-example failure both read this, for the same reason on the
 * example side: one list, one vocabulary.
 */
function exampleNames(locations: readonly ExampleLocation[]): string[] {
  return locations.map(nameOf).sort()
}

/**
 * The failure for an example name the playground does not ship.
 *
 * Every valid name is flavor-qualified, because that is the only vocabulary an example has; listing
 * the stacks as well would suggest a bare name is one of them.
 */
function unknownExample(name: string, locations: ExampleLocation[]): Error {
  return new Error(`Unknown example "${name}". Valid examples: ${exampleNames(locations).join(', ')}`)
}

/** The failure for a stack the playground does not ship. */
function unknownStack(stack: string, locations: ExampleLocation[]): Error {
  return new Error(`Unknown stack "${stack}". Valid stacks: ${stackNames(locations).join(', ')}`)
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
