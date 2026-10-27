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

/**
 * The `jsPlugins` entries an Oxlint Emission declares, whichever override carries them.
 *
 * The Emission declares them once, in one unscoped override, so no object that uses an alias
 * carries a declaration of its own; read them from here rather than from the object under test.
 */
export function jsPluginDeclarations(config: OxlintConfig): Array<{ name: string, specifier: string }> {
  return (config.overrides ?? []).flatMap(override => (override.jsPlugins ?? []).map(entry =>
    typeof entry === 'string' ? { name: entry, specifier: entry } : entry,
  ))
}

/** The same declarations, for an Emission built from `options`. */
export async function jsPluginsOf(options: Options = {}): Promise<Array<{ name: string, specifier: string }>> {
  return jsPluginDeclarations(await oxlint(houseOptions(options)))
}

/**
 * The Bridge of `options`: the tail a resolution with `oxlint` adds over the same options resolved
 * without it.
 *
 * Deriving it through the Composer keeps the tests on the public seam — the Bridge builder is never
 * imported, so it stays free to change — and turns "is it still last" into "is it the tail".
 */
export async function bridgeOf(options: Options = {}): Promise<Linter.Config[]> {
  const without = await eslint(houseOptions({ ...options, oxlint: false }))
  const withBridge = await eslint(houseOptions({ ...options, oxlint: options.oxlint ?? true }))
  return withBridge.slice(without.length)
}
