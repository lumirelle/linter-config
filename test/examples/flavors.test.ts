import type { Linter } from 'eslint'
import { describe, expect, it } from 'vitest'
import { listExamples, listStacks, resolveExample, resolveStack } from '../../playground/examples'
import { bridgeTail, configNames, oxlintRuleKeys, ruleCarryingOverrides } from './helpers/emission'

/**
 * The Domains whose Modules only the ESLint side can serve.
 *
 * Oxlint drops every Config object of them, and the Oxlint Emission keeps neither names nor object
 * boundaries, so the only observable trace of serving them would be a rule key in the Domain's own
 * namespace. A flavor that ships no ESLint config must not carry one.
 */
const ESLINT_ONLY_DOMAINS = ['jsonc', 'yaml', 'toml', 'markdown'] as const

/** Every example the playground ships, resolved the way the runner resolves it. */
const EXAMPLES = await Promise.all((await listExamples()).map(name => resolveExample(name)))

/** Every stack, with the three flavors it ships. */
const STACKS = await Promise.all(
  (await listStacks()).map(async stack => ({ stack, examples: await resolveStack(stack) })),
)

/**
 * What an ESLint Emission is compared on when two flavors are the subject.
 *
 * A whole-object comparison cannot be the assertion: a processor is rebuilt per call (the
 * `@eslint/markdown` merged processor is a new object every time), so two Emissions built from the
 * same options are never identity-equal. Names, file scopes and rules are what a flavor can change;
 * plugins and processors belong to the Modules, not to the example.
 */
function comparableEmission(configs: readonly Linter.Config[]): Array<Pick<Linter.Config, 'name' | 'files' | 'ignores' | 'rules'>> {
  return configs.map(config => ({ name: config.name, files: config.files, ignores: config.ignores, rules: config.rules }))
}

describe('the flavor contract', () => {
  it('resolves every example the playground lists', async () => {
    const names = await listExamples()

    expect(EXAMPLES.map(example => example.name)).toEqual(names)
  })

  describe.each(EXAMPLES)('$name', (example) => {
    it('ships exactly the config modules its flavor names', () => {
      // A caller that needs one Emission asks the flavor that has it; neither is present by accident.
      expect(example.eslint !== undefined).toBe(example.flavor !== 'oxlint')
      expect(example.oxlint !== undefined).toBe(example.flavor !== 'eslint')
    })

    // The three rules below are the flavor dimension of the contract, so each applies to one flavor
    // and is skipped for the other two rather than folded into a branch the reader has to trace.
    it.skipIf(example.flavor !== 'eslint')('appends no Bridge, because it sets no `oxlint` option', () => {
      // The Bridge is enabled by the `oxlint` entry alone. An ESLint-only example that kept the
      // entry would document rules switched off for a tool the project does not run, which is
      // indistinguishable from Source's own severities.
      expect(example.options).not.toHaveProperty('oxlint')
      expect(configNames(example.eslint ?? []).filter(name => name.endsWith('/oxlint-bridge'))).toEqual([])
    })

    it.skipIf(example.flavor !== 'oxlint')('serves no rule of a Domain only ESLint can serve', async () => {
      const oxlint = example.oxlint
      expect(oxlint).toBeDefined()
      expect(oxlintRuleKeys(oxlint!).filter(key => ESLINT_ONLY_DOMAINS.some(domain => key.startsWith(`${domain}/`)))).toEqual([])

      // Non-vacuous on both sides: the stack's ESLint side really does serve those Domains, so the
      // check above cannot pass by having nothing to drop.
      const sibling = (await resolveStack(example.stack)).find(candidate => candidate.eslint !== undefined)
      expect(sibling).toBeDefined()
      const served = ESLINT_ONLY_DOMAINS.filter(domain =>
        configNames(sibling!.eslint!).some(name => name.startsWith(`lumirelle/${domain}/`)),
      )
      expect(served).toEqual([...ESLINT_ONLY_DOMAINS])
    })

    it.skipIf(example.flavor !== 'eslint-oxlint')('appends one Bridge object per rule-carrying Oxlint override', () => {
      // One object per override, whether that override enables its rules or turns them off: the
      // Bridge mirrors whole objects. A stack that never sets the `oxlint` entry opts out, and then
      // the paired Emission is the ESLint flavor's Emission with nothing appended.
      const tail = bridgeTail(example.eslint ?? [])
      expect(example.oxlint).toBeDefined()
      const pairs = ruleCarryingOverrides(example.oxlint!).length

      expect(tail).toHaveLength(example.options.oxlint ? pairs : 0)
      expect(tail.every(config => config.name?.endsWith('/oxlint-bridge'))).toBe(true)
    })
  })

  describe.each(STACKS)('the $stack stack', ({ examples }) => {
    const [eslintFlavor, oxlintFlavor, paired] = examples

    it('ships one directory per flavor', () => {
      // Every stack is the same 3×7 matrix row, so a stack that lost a directory fails here rather
      // than shrinking to the flavors it kept, which would make every relation below compare fewer.
      expect(examples.map(example => example.flavor)).toEqual(['eslint', 'oxlint', 'eslint-oxlint'])
    })

    it('builds all three flavors from one options module, modulo its `oxlint` entry', () => {
      // The options module is the one input every flavor shares: only the `oxlint` entry may differ,
      // and only the ESLint flavor may drop it.
      const withoutOxlint = { ...paired!.options }
      delete withoutOxlint.oxlint

      expect(eslintFlavor!.options).toEqual(withoutOxlint)
      expect(oxlintFlavor!.options).toEqual(paired!.options)
    })

    it('makes the Bridge the only difference between the two ESLint flavors', () => {
      // Subtracting the tail the Emission carries itself is what makes this a relation rather than a
      // pinned snapshot: a stack with no `oxlint` entry has no tail, so its two ESLint flavors emit
      // the same objects and the flavor difference there is the Oxlint config module alone.
      const emission = paired!.eslint!
      const tail = bridgeTail(emission)
      const head = emission.slice(0, emission.length - tail.length)

      expect(comparableEmission(eslintFlavor!.eslint!)).toEqual(comparableEmission(head))
    })

    it('gives the Oxlint flavor the paired flavor\'s Oxlint Emission exactly', () => {
      expect(oxlintFlavor!.oxlint).toEqual(paired!.oxlint)
    })
  })
})
