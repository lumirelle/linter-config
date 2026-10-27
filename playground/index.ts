import type { Example } from './examples'
import process from 'node:process'
import { listStacks, resolveExample, resolveStack } from './examples'

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

/** Print one example's block: its name, then only the Emissions its flavor ships. */
function printExample(example: Example): void {
  // oxlint-disable-next-line no-console
  console.log(`Example: ${example.name}`)
  if (example.eslint) {
    // oxlint-disable-next-line no-console
    console.log('ESLint emission:', example.eslint)
  }
  if (example.oxlint) {
    // oxlint-disable-next-line no-console
    console.log('Oxlint emission:', example.oxlint)
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
