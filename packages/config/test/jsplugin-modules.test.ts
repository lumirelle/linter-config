import type { Linter } from 'eslint'
import type { OxlintConfig } from 'oxlint'
import type { ModuleId } from '../src/types'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { ESLint } from 'eslint'
import { describe, expect, it } from 'vitest'
import { eslint } from '../src/eslint'
import { oxlint } from '../src/oxlint'
import { coverageReport } from '../src/oxlint/report'
import { eslintObject, jsPluginDeclarations } from './helpers/emission'
import { expectJsPluginFires } from './helpers/oxlint-jsplugin'

const FIXTURES = fileURLToPath(new URL('./fixtures/jsplugins/', import.meta.url))

type Options = Parameters<typeof oxlint>[0]

/** The house Emission, with `.gitignore` reading and editor detection pinned. */
function house(options: Options = {}): Options {
  return { gitignore: false, isInEditor: false, ...options }
}

/** Every rule key the ESLint Emission writes, so a plugin can be looked for without serializing plugin objects. */
function eslintRuleKeys(configs: Linter.Config[]): string[] {
  return configs.flatMap(config => Object.keys(config.rules ?? {}))
}

/** The same, for the Oxlint Emission: `rules` live on the overrides. */
function oxlintRuleKeys(config: OxlintConfig): string[] {
  return (config.overrides ?? []).flatMap(override => Object.keys(override.rules ?? {}))
}

/** Whether any emitted rule key belongs to `plugin`; the rule keys themselves are too many to list. */
function withPrefix(keys: string[], plugin: string): boolean {
  return keys.some(key => key.startsWith(`${plugin}/`))
}

/** A Module this ticket ports, with the object it emits and the plugin the Emission must declare. */
interface PortedModule {
  module: ModuleId
  name: string
  plugin: string
  /** The option that turns the Module on, when it is not on by default. */
  options?: Options
  /** Modules Upstream always enables have no option to turn them off. */
  alwaysOn?: true
}

const PORTED: PortedModule[] = [
  { alwaysOn: true, module: 'command', name: 'lumirelle/command/rules', plugin: 'command' },
  { module: 'e18e', name: 'lumirelle/e18e/rules', plugin: 'e18e' },
  { module: 'perfectionist', name: 'lumirelle/perfectionist/setup', plugin: 'perfectionist' },
  { module: 'regexp', name: 'lumirelle/regexp/rules', plugin: 'regexp' },
  { module: 'antislop', name: 'lumirelle/antislop/setup', options: { antislop: true }, plugin: 'sonar' },
]

/** One Plugin the Emission loads through `jsPlugins`, and the rule its fixture must trip. */
const PROBES = [
  { plugin: 'antfu', rule: 'antfu/no-top-level-await' },
  { plugin: 'command', rule: 'command/command' },
  { plugin: 'e18e', rule: 'e18e/prefer-includes' },
  { plugin: 'perfectionist', rule: 'perfectionist/sort-named-imports' },
  { plugin: 'regexp', rule: 'regexp/no-useless-escape' },
  { plugin: 'slop', options: { antislop: true }, rule: 'slop/no-em-dash' },
  { plugin: 'sonar', options: { antislop: true }, rule: 'sonar/no-collapsible-if' },
  { plugin: 'unused-imports', rule: 'unused-imports/no-unused-imports' },
] as const

describe.each(PORTED)('the $module Module', ({ alwaysOn = false, module, name, plugin, options }) => {
  it('emits its Config object with the plugin declared and rules to use it', async () => {
    const object = await eslintObject(name, options)
    const rules = (await eslint(house(options)))
      .filter(config => config.name?.startsWith(`lumirelle/${module}/`))
      .flatMap(config => Object.keys(config.rules ?? {}))

    expect(Object.keys(object.plugins ?? {})).toContain(plugin)
    expect(rules.length).toBeGreaterThan(0)
  })

  it('declares the plugin once, under the alias its rule keys use', async () => {
    const declared = jsPluginDeclarations(await oxlint(house(options)))

    expect(declared.filter(entry => entry.name === plugin)).toHaveLength(1)
  })

  it.skipIf(alwaysOn)('emits on both sides, and on neither when its option is off', async () => {
    const off = house({ ...options, [module]: false } as Options)

    expect(withPrefix(eslintRuleKeys(await eslint(house(options))), plugin)).toBe(true)
    expect(withPrefix(oxlintRuleKeys(await oxlint(house(options))), plugin)).toBe(true)
    expect(withPrefix(eslintRuleKeys(await eslint(off)), plugin)).toBe(false)
    expect(withPrefix(oxlintRuleKeys(await oxlint(off)), plugin)).toBe(false)
  })
})

describe('the eslint-comments Module', () => {
  it('emits its four rules for ESLint', async () => {
    const object = await eslintObject('lumirelle/eslint-comments/rules')

    expect(Object.keys(object.rules ?? {}).sort()).toEqual([
      'eslint-comments/no-aggregating-enable',
      'eslint-comments/no-duplicate-disable',
      'eslint-comments/no-unlimited-disable',
      'eslint-comments/no-unused-enable',
    ])
  })

  it('records every rule as blacklisted instead of declaring the plugin to Oxlint', async () => {
    const config = await oxlint(house())
    const recorded = coverageReport().modules['eslint-comments'] ?? []

    expect(jsPluginDeclarations(config).map(entry => entry.name)).not.toContain('eslint-comments')
    expect(JSON.stringify(config)).not.toContain('"eslint-comments/')
    expect(recorded).toHaveLength(4)
    expect(recorded.every(entry => entry.reason === 'blacklisted-plugin' && entry.plugin === 'eslint-comments')).toBe(true)
  })
})

describe('the same fixtures under the real ESLint', () => {
  it.each(PROBES)('$plugin: $rule fires on its fixture and stays quiet on the clean one', { timeout: 30_000 }, async (probe) => {
    const options = 'options' in probe ? probe.options : undefined
    const eslintApi = new ESLint({
      cwd: FIXTURES,
      overrideConfig: await eslint(house(options)),
      overrideConfigFile: true,
    })
    const lint = async (file: string): Promise<string[]> =>
      (await eslintApi.lintFiles([join(probe.plugin, file)]))
        .flatMap(result => result.messages.map(message => message.ruleId ?? '(fatal)'))
        .filter(ruleId => ruleId === probe.rule)

    expect(await lint('violations.js'), `${probe.rule} should fire on ${probe.plugin}/violations.js`).not.toEqual([])
    expect(await lint('clean.js'), `${probe.rule} should not fire on ${probe.plugin}/clean.js`).toEqual([])
  })
})

describe('the jsPlugins every ported Module leans on', () => {
  it.each(PROBES)('$plugin: $rule fires on its fixture and stays quiet on the clean one', { timeout: 30_000 }, async (probe) => {
    await expectJsPluginFires({
      clean: 'clean.js',
      fixture: 'violations.js',
      fixtures: join(FIXTURES, probe.plugin),
      options: 'options' in probe ? probe.options : undefined,
      plugin: probe.plugin,
      rule: probe.rule,
    })
  })
})
