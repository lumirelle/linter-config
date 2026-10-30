import { describe, expect, it } from 'vitest'
import { options } from '../config/linter'
import { eslint } from '../packages/config/src/eslint'
import { oxlint } from '../packages/config/src/oxlint'
import { pluginDefinition, pluginIdOfRuleKey } from '../packages/config/src/plugins'
import { bridgeOf } from '../packages/config/test/helpers/emission'

/**
 * Oxlint's spelling of a Source rule key, read from the Plugin registry both Emissions map with:
 * a rule with a built-in scope becomes `scope/rule`, and one with only a `jsPlugins` alias keeps
 * the alias, which equals its Plugin id.
 */
function oxlintRuleKey(key: string): string {
  const id = pluginIdOfRuleKey(key)
  const builtin = id ? pluginDefinition(id).oxlint?.builtin : undefined
  return id && builtin ? `${builtin}/${key.slice(id.length + 1)}` : key
}

/** A rule entry's severity, which is its first element when it carries options. */
function severity(entry: unknown): unknown {
  return Array.isArray(entry) ? entry[0] : entry
}

function isEnabled(entry: unknown): boolean {
  return severity(entry) !== 'off' && severity(entry) !== 0
}

/** The ESLint Emission without the Bridge, so `off` entries cannot mask what Source turned on. */
async function eslintEnabledConfigs(): Promise<Awaited<ReturnType<typeof eslint>>> {
  return eslint({ ...options, oxlint: false })
}

/** The rule keys the ESLint Emission enables, in Source spelling. */
async function eslintEnabledRules(): Promise<string[]> {
  const configs = await eslintEnabledConfigs()
  const enabled = new Set<string>()
  for (const config of configs) {
    for (const [key, entry] of Object.entries(config.rules ?? {})) {
      if (isEnabled(entry)) {
        enabled.add(key)
      }
    }
  }
  return [...enabled]
}

/**
 * The rule keys the Bridge turns off, in Oxlint spelling, as the tail `oxlint` adds to this Emission.
 * The helper pins the cwd-reading flags; the Bridge depends only on Config objects that carry rules,
 * so neither the `.gitignore` ignores nor editor detection can change it.
 */
async function bridgeDisabledRules(): Promise<string[]> {
  const disabled = (await bridgeOf(options)).flatMap(config => Object.keys(config.rules ?? {}))
  return [...new Set(disabled.map(oxlintRuleKey))].sort()
}

/** The rule keys the Oxlint Emission reports, in its own spelling. */
async function oxlintEnabledRules(): Promise<string[]> {
  const config = await oxlint(options)
  const overrides = config.overrides ?? []
  const enabled = new Set<string>()
  for (const rules of [config.rules ?? {}, ...overrides.map(override => override.rules ?? {})]) {
    for (const [key, entry] of Object.entries(rules)) {
      if (isEnabled(entry)) {
        enabled.add(key)
      }
    }
  }
  return [...enabled].sort()
}

describe("the repository's own two configs", () => {
  it('builds both Emissions from one options object, so the Bridge silences only what Oxlint reports', async () => {
    const sourceEnabled = new Set((await eslintEnabledRules()).map(oxlintRuleKey))
    const bridge = (await bridgeDisabledRules()).filter(key => sourceEnabled.has(key))

    // Every rule the Bridge turns off is a rule Oxlint reports...
    expect(await oxlintEnabledRules()).toEqual(expect.arrayContaining(bridge))
    // ...and every rule Oxlint reports is turned off in ESLint, so nothing is reported twice.
    expect(bridge).toEqual(await oxlintEnabledRules())
  })

  it('hands Oxlint the rule sets that only the TypeScript and lib options produce', async () => {
    const reported = await oxlintEnabledRules()

    // `typescript.tsconfigPath` brings the type-aware rules to both sides; passing it to ESLint
    // alone would leave the Bridge turning them off where Oxlint never reports them.
    expect(reported).toContain('typescript/explicit-function-return-type')
    // `type: 'lib'` keeps `e18e/prefer-static-regex` on; an Oxlint config that omitted the option
    // would report it as `off` and the Bridge would still silence it in ESLint.
    expect(reported).toContain('e18e/prefer-static-regex')
  })
})
