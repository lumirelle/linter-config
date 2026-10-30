import type { ModuleId, Options } from '@lumirelle/linter-config'
import type { Example } from '../../playground/examples'
import { describe, expect, it } from 'vitest'
import { listExamples, resolveStack } from '../../playground/examples'
import {
  bridgeTail,
  comparableEmission,
  configNames,
  exampleTables,
  expectNoModules,
  objectsOfModule,
  optionsByStack,
  oxlintRuleKeys,
  ruleCarryingOverrides,
} from './helpers/emission'

/**
 * The Domains whose Modules only the ESLint side can serve.
 *
 * Oxlint drops every Config object of them, and the Oxlint Emission keeps neither names nor object
 * boundaries, so the only observable trace of serving them would be a rule key in the Domain's own
 * namespace. A flavor that ships no ESLint config must not carry one.
 */
const ESLINT_ONLY_DOMAINS = ['jsonc', 'yaml', 'toml', 'markdown'] as const

/**
 * The framework Modules an example can enable, by the option key that enables them.
 *
 * The Module assertions below read this map and the example's own options module, never the
 * Emission they check: an expectation derived from the Emission could agree with it by
 * construction. Every framework Module is listed, because each one absent from an options module is
 * a Module the Emission must not carry.
 */
const FRAMEWORK_MODULES = new Map<keyof Options, ModuleId>([
  ['angular', 'angular'],
  ['astro', 'astro'],
  ['jsx', 'jsx'],
  ['nextjs', 'nextjs'],
  ['react', 'react'],
  ['solid', 'solid'],
  ['svelte', 'svelte'],
  ['unocss', 'unocss'],
  ['vue', 'vue'],
] as const)

/** The framework Modules an options module enables. */
function enabledModules(options: Options): ModuleId[] {
  return [...FRAMEWORK_MODULES].flatMap(([option, module]) => options[option] ? [module] : [])
}

/** Every framework Module the map names that `enabled` leaves out. */
function disabledModules(enabled: readonly ModuleId[]): ModuleId[] {
  return [...FRAMEWORK_MODULES.values()].filter(module => !enabled.includes(module))
}

/** Every example the playground ships, and every stack with the three flavors it ships. */
const { examples: EXAMPLES, stacks: STACKS } = await exampleTables()

/** Each stack's options, read from the paired flavor, which is the one example that keeps a module. */
const STACK_OPTIONS = optionsByStack(STACKS)

/** The options the stack ships, whichever flavor is asking. */
function optionsOf(example: Example): Options {
  const options = STACK_OPTIONS.get(example.stack)
  if (!options) {
    throw new Error(`The "${example.stack}" stack has no options module.`)
  }
  return options
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
      // The Bridge is enabled by the `oxlint` entry alone. A project that runs no Oxlint has nothing
      // to bridge, and it writes its options inline rather than keeping a module for a second config
      // that does not exist.
      expect(example.options).toBeUndefined()
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

      expect(tail).toHaveLength(optionsOf(example).oxlint ? pairs : 0)
      expect(tail.every(config => config.name?.endsWith('/oxlint-bridge'))).toBe(true)
    })

    it.skipIf(example.eslint === undefined)('carries no Config object of a framework Module its options leave off', () => {
      // The expectation comes from the options module, so this holds for every example the
      // playground ships, not only for the ones with a per-stack spec: an option that leaked
      // between examples shows up as an object of a Module its own options never enable.
      expectNoModules(example.eslint ?? [], disabledModules(enabledModules(optionsOf(example))))
    })

    it.skipIf(example.flavor !== 'eslint-oxlint' || enabledModules(optionsOf(example)).length === 0)('carries the framework Modules its options enable', () => {
      // Once per example, on the flavor that builds every Module's objects: the absence above is
      // only meaningful while the Modules the options module does enable still put objects in an
      // Emission. A stack that enables no framework Module has nothing to assert here.
      for (const module of enabledModules(optionsOf(example))) {
        expect(objectsOfModule(example.eslint ?? [], module), `the Emission drops the ${module} objects`).not.toEqual([])
      }
    })
  })

  describe.each(STACKS)('the $stack stack', ({ examples }) => {
    const [eslintFlavor, oxlintFlavor, paired] = examples

    it('ships one directory per flavor', () => {
      // Every stack is the same 3×7 matrix row, so a stack that lost a directory fails here rather
      // than shrinking to the flavors it kept, which would make every relation below compare fewer.
      expect(examples.map(example => example.flavor)).toEqual(['eslint', 'oxlint', 'eslint-oxlint'])
    })

    it('keeps the options module in the paired flavor alone', () => {
      // The module exists so two configs can read one object. A single-tool flavor has one config, so
      // it writes the same options inline where it calls that factory, which is what a consumer with
      // one tool does; the Emission relations below are what prove the options match.
      expect(paired!.options).toBeDefined()
      expect(eslintFlavor!.options).toBeUndefined()
      expect(oxlintFlavor!.options).toBeUndefined()
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
