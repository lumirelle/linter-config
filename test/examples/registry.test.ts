import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { listExamples, listStacks, resolveExample, resolveStack } from '../../playground/examples'

/** Every stack the playground ships, in the sorted order the registry returns them. */
const STACKS = ['next', 'nuxt', 'react', 'ts', 'ts-monorepo', 'vue', 'webext']

/**
 * The example names the playground ships, sorted.
 *
 * A flat directory is the paired flavor, so its name is `eslint-oxlint/<stack>`; a converted stack
 * contributes one name per flavor, and the other stacks gain theirs as they are converted.
 */
const EXAMPLE_NAMES = [
  'eslint-oxlint/next',
  'eslint-oxlint/nuxt',
  'eslint-oxlint/react',
  'eslint-oxlint/ts',
  'eslint-oxlint/ts-monorepo',
  'eslint-oxlint/vue',
  'eslint-oxlint/webext',
  'eslint/next',
  'eslint/nuxt',
  'eslint/react',
  'eslint/ts',
  'eslint/ts-monorepo',
  'eslint/vue',
  'eslint/webext',
  'oxlint/next',
  'oxlint/nuxt',
  'oxlint/react',
  'oxlint/ts',
  'oxlint/ts-monorepo',
  'oxlint/vue',
  'oxlint/webext',
]

describe('the example registry', () => {
  it('lists the stacks the playground ships, sorted', async () => {
    expect(await listStacks()).toEqual(STACKS)
  })

  it('lists exactly the examples the playground ships, sorted', async () => {
    expect(await listExamples()).toEqual(EXAMPLE_NAMES)
  })

  it('resolves a flavor-qualified name to that flavor\'s directory', async () => {
    const example = await resolveExample('eslint-oxlint/ts')

    expect(example.name).toBe('eslint-oxlint/ts')
    expect(example.flavor).toBe('eslint-oxlint')
    expect(example.stack).toBe('ts')
    expect(example.directory.endsWith(join('playground', 'eslint-oxlint', 'ts'))).toBe(true)
  })

  it('still resolves a bare stack name, as that stack\'s paired flavor', async () => {
    // The pre-flavor spelling of an example name, kept only until every stack ships one directory
    // per flavor; a stack spec can load a stack without naming its flavor.
    const [bare, qualified] = await Promise.all([resolveExample('ts'), resolveExample('eslint-oxlint/ts')])

    expect(bare.name).toBe('eslint-oxlint/ts')
    expect(bare.directory).toBe(qualified.directory)
    expect(bare.options).toEqual(qualified.options)
  })

  it('resolves every stack into its three flavors in flavor order', async () => {
    // Every stack now ships one directory per flavor, and the runner prints a bare stack name in
    // this order. Asserting it per stack is what makes a lost directory or a wrong flavor order
    // fail here rather than in a printed Emission.
    const resolved = await Promise.all(STACKS.map(async stack => ({ stack, flavors: await resolveStack(stack) })))

    for (const { stack, flavors } of resolved) {
      expect(flavors.map(example => example.name)).toEqual([
        `eslint/${stack}`,
        `oxlint/${stack}`,
        `eslint-oxlint/${stack}`,
      ])
      expect(flavors.map(example => example.stack)).toEqual([stack, stack, stack])
    }
  })

  it('resolves a stack\'s paired flavor with both Emissions built from its own options module', async () => {
    const example = await resolveExample('eslint-oxlint/ts')

    // The Emissions come back resolved: the ESLint one carries the TypeScript objects the example
    // asks for, and the Oxlint one runs in the type-aware mode its options module names.
    expect(example.eslint?.map(config => config.name)).toContain('lumirelle/typescript/rules')
    expect(example.oxlint?.options).toEqual({ typeAware: true })
    expect(example.options.type).toBe('lib')
  })

  it('fails an unknown name, naming every stack and every example', async () => {
    // Both vocabularies, because a caller may have meant a stack the runner expands or one example,
    // and neither is guessable from the shape of the other.
    const failure = await resolveExample('nope').then(() => undefined, (error: Error) => error)

    expect(failure?.message).toBe(
      `Unknown example "nope". Valid stacks: ${STACKS.join(', ')}. Valid examples: ${EXAMPLE_NAMES.join(', ')}`,
    )
  })

  it('fails an unknown stack the same way', async () => {
    const failure = await resolveStack('nope').then(() => undefined, (error: Error) => error)

    expect(failure?.message).toBe(
      `Unknown example "nope". Valid stacks: ${STACKS.join(', ')}. Valid examples: ${EXAMPLE_NAMES.join(', ')}`,
    )
  })
})
