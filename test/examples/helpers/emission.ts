import type { ModuleId } from '@lumirelle/linter-config/eslint'
import type { Linter } from 'eslint'
import type { OxlintConfig } from 'oxlint'
import type { Example } from '../../../playground/examples'
import { expect } from 'vitest'
import { resolveExample } from '../../../playground/examples'

/** One example as a stack spec loads it: its options module plus both Emissions. */
export type ExampleEmissions = Example & {
  eslint: readonly Linter.Config[]
  oxlint: OxlintConfig
}

/** One Oxlint override, as the Emission writes it. */
export type OxlintOverride = NonNullable<OxlintConfig['overrides']>[number]

/**
 * Load one example exactly as `mise run play` does: through the registry, which imports the
 * example's own config modules, so the Emission is the one a consumer's file would build.
 *
 * Both Emissions come back resolved, so every test that loads an example has also loaded the
 * Oxlint side: a missing peer, parser or processor throws here, not in a consumer's repository.
 * A stack spec asserts stack semantics, which do not vary by flavor, so it loads the stack's paired
 * flavor — the one that ships both config modules — and this is where that is required rather than
 * in every spec.
 *
 * The assertions read Config object names rather than pinning `.gitignore` discovery and editor
 * detection the way `houseOptions()` does for the repository's own config: those two inputs change
 * ignore contents and rule severities, never the names, and an example's options module stays the
 * consumer-realistic object a reader copies.
 */
export async function loadExample(name: string): Promise<ExampleEmissions> {
  const example = await resolveExample(name)
  const { eslint, oxlint } = example
  if (!eslint || !oxlint) {
    throw new Error(`The example "${example.name}" ships only one config module, so it has no paired Emission pair.`)
  }
  return { ...example, eslint, oxlint }
}

/** The Config object names an ESLint Emission carries, in emission order. */
export function configNames(configs: readonly Linter.Config[]): string[] {
  return configs.flatMap(config => config.name === undefined ? [] : [config.name])
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
export function expectNoModules(configs: readonly Linter.Config[], modules: readonly ModuleId[]): void {
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
 * Some assertions read what a Module put inside one object — the rule table an option extends, the
 * plugins it declares — which the name list `configNames` returns cannot answer.
 */
export function configNamed(configs: readonly Linter.Config[], name: string): Linter.Config {
  const config = configs.find(candidate => candidate.name === name)
  if (!config) {
    throw new Error(`This Emission has no Config object named "${name}".`)
  }
  return config
}
