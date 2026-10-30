import type { Example } from './examples'
import process from 'node:process'
import { listStacks, resolveExample, resolveStack } from './examples'
import { pluginPackageName } from './specifiers'

const USAGE = 'Usage: mise run play <name> | mise run play --all'

/**
 * The examples one name names.
 *
 * A bare stack name is the spelling `mise run play` has always taken, and it expands into that
 * stack's flavors, in flavor order. A `<flavor>/<stack>` name names one example, so a contributor
 * can isolate the flavor they are working on.
 */
async function examplesNamed(name: string): Promise<Example[]> {
  if (!name.includes('/')) {
    return resolveStack(name)
  }
  const example = await resolveExample(name)
  return [example]
}

/** True for a plain object, the shape every config object in an Emission has. */
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/** One `jsPlugins` entry with its specifier replaced by the package it names, in its own spelling. */
function withEntryPackageName(entry: unknown): unknown {
  if (typeof entry === 'string') {
    return pluginPackageName(entry)
  }
  if (isRecord(entry) && typeof entry.specifier === 'string') {
    return { ...entry, specifier: pluginPackageName(entry.specifier) }
  }
  return entry
}

/**
 * An Emission as the runner prints it: the same shape, with every Plugin specifier it carries, in
 * the root object or in an override, naming its package.
 *
 * The Emission is free to hold the absolute path a Bundle resolved a plugin to, but printed output is
 * read and diffed across machines, so the path a store happens to use never reaches it.
 */
function withPackageNames(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(withPackageNames)
  }
  if (!isRecord(value)) {
    return value
  }

  const rendered: Record<string, unknown> = { ...value }
  if (Array.isArray(rendered.jsPlugins)) {
    rendered.jsPlugins = rendered.jsPlugins.map(withEntryPackageName)
  }
  if (Array.isArray(rendered.overrides)) {
    rendered.overrides = rendered.overrides.map(withPackageNames)
  }
  return rendered
}

/** Print one example's block: its name, then only the Emissions its flavor ships. */
function printExample(example: Example): void {
  // oxlint-disable-next-line no-console
  console.log(`Example: ${example.name}`)
  if (example.eslint) {
    // oxlint-disable-next-line no-console
    console.log('ESLint emission:', withPackageNames(example.eslint))
  }
  if (example.oxlint) {
    // oxlint-disable-next-line no-console
    console.log('Oxlint emission:', withPackageNames(example.oxlint))
  }
}

/**
 * Run the `play` task: one example, one stack's flavors, or every example with `--all`.
 *
 * An unknown name exits non-zero after listing the valid stacks and examples, so a typo never looks
 * like an empty Emission.
 */
async function main(args: string[]): Promise<void> {
  const all = args.includes('--all')
  const names = args.filter(arg => arg !== '--all')

  if (all && names.length > 0) {
    console.error(`\`--all\` takes no example name, got: ${names.join(' ')}`)
    process.exitCode = 1
    return
  }
  if (!all && names.length !== 1) {
    console.error(USAGE)
    process.exitCode = 1
    return
  }

  try {
    // `--all` walks the stacks, so a stack's examples are printed together, flavors in order.
    for (const name of all ? await listStacks() : names) {
      for (const example of await examplesNamed(name)) {
        printExample(example)
      }
    }
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error))
    process.exitCode = 1
  }
}

void main(process.argv.slice(2))
