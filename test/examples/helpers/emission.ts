import type { ModuleId, Options } from '@lumirelle/linter-config'
import type { Linter } from 'eslint'
import type { OxlintConfig } from 'oxlint'
import type { Example } from '../../../playground/examples'
import { expect } from 'vitest'
import {
  listExamples,
  listStacks,
  resolveExample,
  resolveStack,
} from '../../../playground/examples'

/** One example as a stack spec loads it: its options module plus both Emissions. */
export type ExampleEmissions = Example & {
  options: Options
  eslint: readonly Linter.Config[]
  oxlint: OxlintConfig
}

/** One Oxlint override, as the Emission writes it. */
export type OxlintOverride = NonNullable<OxlintConfig['overrides']>[number]

/** A stack with the examples it ships. */
export interface StackExamples {
  stack: string
  examples: Example[]
}

/**
 * The registry tables both example specs declare their `describe.each` rows from.
 *
 * Resolving them here keeps the discovery out of the specs, which only bind the result. It cannot be
 * a constant: both tables are awaited from the registry, and the house rules ban a top-level await
 * outside a test file, while this module is test scaffolding rather than one.
 */
export async function exampleTables(): Promise<{ examples: Example[]; stacks: StackExamples[] }> {
  const [examples, stacks] = await Promise.all([
    listExamples().then(names => Promise.all(names.map(name => resolveExample(name)))),
    listStacks().then(names =>
      Promise.all(names.map(async stack => ({ stack, examples: await resolveStack(stack) }))),
    ),
  ])

  return { examples, stacks }
}

/**
 * Each stack's options, keyed by stack name.
 *
 * The paired flavor is the only example that keeps them in a module, because its two configs read one
 * object. A single-tool flavor writes the same options where it calls its one factory, the way a
 * consumer with one tool does, so there is no module to read there: the Emission relation is what
 * proves it built from the stack's options.
 */
export function optionsByStack(stacks: readonly StackExamples[]): Map<string, Options> {
  return new Map(
    stacks.map(({ stack, examples }) => {
      const paired = examples.find(example => example.flavor === 'eslint-oxlint')
      if (!paired?.options) {
        throw new Error(`The "${stack}" stack ships no paired flavor with an options module.`)
      }
      return [stack, paired.options] as const
    }),
  )
}

/**
 * Load one example exactly as `mise run play` does: through the registry, which imports the
 * example's own config modules, so the Emission is the one a consumer's file would build.
 *
 * Both Emissions come back resolved, so every test that loads an example has also loaded the
 * Oxlint side: a missing peer, parser or processor throws here, not in a consumer's repository.
 * A stack spec asserts stack semantics, which do not vary by flavor, so it loads the stack's paired
 * flavor, the one that ships both config modules, and this is where that is required rather than in
 * every spec.
 *
 * The assertions read Config object names rather than pinning `.gitignore` discovery and editor
 * detection the way `houseOptions()` does for the repository's own config: those two inputs change
 * ignore contents and rule severities, never the names, and an example's options module stays the
 * consumer-realistic object a reader copies.
 */
export async function loadExample(name: string): Promise<ExampleEmissions> {
  const example = await resolveExample(name)
  const { eslint, options, oxlint } = example
  if (!eslint || !oxlint || !options) {
    throw new Error(
      `The example "${example.name}" is not a paired flavor: it ships neither two config modules nor an options module.`,
    )
  }
  return { ...example, options, eslint, oxlint }
}

/**
 * What an ESLint Emission is compared on when two flavors or two Modules are the subject.
 *
 * A whole-object comparison cannot be the assertion: a processor is rebuilt per call (the
 * `@eslint/markdown` merged processor is a new object every time), so two Emissions built from the
 * same options are never identity-equal. Names, file scopes and rules are what a flavor can change;
 * plugins and processors belong to the Modules, not to the example.
 */
export function comparableEmission(
  configs: readonly Linter.Config[],
): Array<Pick<Linter.Config, 'name' | 'files' | 'ignores' | 'rules'>> {
  return configs.map(config => ({
    name: config.name,
    files: config.files,
    ignores: config.ignores,
    rules: config.rules,
  }))
}

/** The Config object names an ESLint Emission carries, in emission order. */
export function configNames(configs: readonly Linter.Config[]): string[] {
  return configs.flatMap(config => (config.name === undefined ? [] : [config.name]))
}

/**
 * The Bridge tail of an ESLint Emission: the Config objects an example's `oxlint` entry appends.
 *
 * Read out of the Emission the registry returned, never rebuilt from the example's options, so an
 * assertion cannot agree with the Bridge builder by construction. The Bridge is the last part of an
 * Emission, so the tail is the run of `/oxlint-bridge` objects at its end: a Bridge object anywhere
 * else shortens the tail, which is what the callers' length assertions turn into a failure.
 */
export function bridgeTail(configs: readonly Linter.Config[]): Linter.Config[] {
  const tail: Linter.Config[] = []
  for (let index = configs.length - 1; index >= 0; index--) {
    const config = configs[index]!
    if (!config.name?.endsWith('/oxlint-bridge')) {
      break
    }
    tail.unshift(config)
  }
  return tail
}

/**
 * The overrides an Oxlint Emission uses to carry rules.
 *
 * The Emission pairs one Bridge object with each of them, so this count is what a paired flavor's
 * Bridge tail has to match. Overrides that only declare plugins or environments carry no rules and
 * get no Bridge object.
 */
export function ruleCarryingOverrides(oxlint: OxlintConfig): OxlintOverride[] {
  return (oxlint.overrides ?? []).filter(override => Object.keys(override.rules ?? {}).length > 0)
}

/** Every rule key an Oxlint Emission carries, top-level and per override. */
export function oxlintRuleKeys(oxlint: OxlintConfig): string[] {
  return [
    ...Object.keys(oxlint.rules ?? {}),
    ...(oxlint.overrides ?? []).flatMap(override => Object.keys(override.rules ?? {})),
  ]
}

/** The Config object names an ESLint Emission carries for `module`. */
export function objectsOfModule(configs: readonly Linter.Config[], module: ModuleId): string[] {
  return configNames(configs).filter(name => name.startsWith(`lumirelle/${module}/`))
}

/**
 * Asserts that an ESLint Emission carries no Config object of any Module in `modules`.
 *
 * An example enables one framework at most, so the Modules it leaves off are the other half of its
 * assertion: an option that leaked between examples shows up as an object of a Module the example
 * never enabled.
 */
export function expectNoModules(
  configs: readonly Linter.Config[],
  modules: readonly ModuleId[],
): void {
  for (const module of modules) {
    expect(objectsOfModule(configs, module), `the Emission carries ${module} objects`).toEqual([])
  }
}

/**
 * Asserts that an Oxlint Emission reads `.vue` files through Oxlint's own built-in `vue` scope.
 *
 * `vue` and `nuxt` ask for the same thing, so the plugin declaration is stated once.
 */
export function expectOxlintReadsVue(oxlint: OxlintConfig): void {
  expect(oxlint.plugins).toContain('vue')
}

/**
 * The Config object an ESLint Emission carries under `name`.
 *
 * Some assertions read what a Module put inside one object, the rule table an option extends or the
 * plugins it declares, which the name list `configNames` returns cannot answer.
 */
export function configNamed(configs: readonly Linter.Config[], name: string): Linter.Config {
  const config = configs.find(candidate => candidate.name === name)
  if (!config) {
    throw new Error(`This Emission has no Config object named "${name}".`)
  }
  return config
}
