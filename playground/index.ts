import process from 'node:process'
import { listExamples, resolveExample } from './examples'

const USAGE = 'Usage: mise run play <name> | mise run play --all'

/** Print one example's two Emissions, in the serialization the old single playground used. */
async function printExample(name: string): Promise<void> {
  const { eslint, oxlint } = await resolveExample(name)
  // oxlint-disable-next-line no-console
  console.log(`Example: ${name}`)
  // oxlint-disable-next-line no-console
  console.log('ESLint emission:', eslint)
  // oxlint-disable-next-line no-console
  console.log('Oxlint emission:', oxlint)
}

/**
 * Run the `play` task: one example by name, or every example with `--all`.
 *
 * An unknown name exits non-zero after listing the valid ones, so a typo never looks like an
 * empty Emission.
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
    for (const name of all ? await listExamples() : names) {
      await printExample(name)
    }
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error))
    process.exitCode = 1
  }
}

void main(process.argv.slice(2))
