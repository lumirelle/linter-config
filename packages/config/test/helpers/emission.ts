import type { Linter } from 'eslint'
import type { OxlintConfig } from 'oxlint'
import { eslint } from '../../src/eslint'
import { oxlint } from '../../src/oxlint'

type Options = Parameters<typeof eslint>[0]

/** One Oxlint override, as the Emission writes it. */
type OxlintObject = NonNullable<OxlintConfig['overrides']>[number]

/** The house Emission: `.gitignore` reading and editor detection pinned, so nothing reads the cwd. */
export function houseOptions(options: Options = {}): Options {
  return { gitignore: false, isInEditor: false, ...options }
}

/** The ESLint object with that name; a rename fails loudly instead of skipping the assertion. */
export async function eslintObject(name: string, options: Options = {}): Promise<Linter.Config> {
  const config = (await eslint(houseOptions(options))).find(config => config.name === name)
  if (!config) {
    throw new Error(`eslint() emitted no "${name}" object`)
  }
  return config
}

/**
 * The Oxlint override that carries `ruleKey`.
 *
 * Oxlint's configuration has no name field, so the composer keeps Config object names for
 * addressing only and the Emission drops them; a rule key identifies an object instead.
 */
export async function oxlintObjectWith(ruleKey: string, options: Options = {}): Promise<OxlintObject> {
  const override = ((await oxlint(houseOptions(options))).overrides ?? []).find(override => ruleKey in (override.rules ?? {}))
  if (!override) {
    throw new Error(`oxlint() emitted no override carrying "${ruleKey}"`)
  }
  return override
}

/** A rule entry as either Emission carries it. */
export function rulesOf(config: { rules?: Record<string, unknown> }): Record<string, unknown> {
  return config.rules ?? {}
}
