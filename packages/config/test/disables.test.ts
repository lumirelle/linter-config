import type { Linter } from 'eslint'
import type { OxlintConfig } from 'oxlint'
import { minimatch } from 'minimatch'
import { describe, expect, it } from 'vitest'
import { eslint } from '../src/eslint'
import { GLOB_SRC, GLOB_SRC_EXT } from '../src/globs'
import { oxlint } from '../src/oxlint'
import { coverageReport } from '../src/oxlint/report'
import { houseOptions } from './helpers/emission'

type Options = Parameters<typeof eslint>[0]

/** The disables objects of an Emission, in emission order. */
async function disablesObjects(options: Options = {}): Promise<Linter.Config[]> {
  return (await eslint(houseOptions(options))).filter(config => config.name.startsWith('lumirelle/disables/'))
}

/** How the Oxlint Emission spells each rule the disables table turns off, or `undefined` if it drops it. */
const OXLINT_SPELLING: Readonly<Record<string, string | undefined>> = {
  'antfu/no-import-dist': 'antfu/no-import-dist',
  'antfu/no-import-node-modules-by-path': 'antfu/no-import-node-modules-by-path',
  'antfu/no-top-level-await': 'antfu/no-top-level-await',
  'no-console': 'no-console',
  'no-restricted-syntax': undefined,
  'ts/explicit-function-return-type': 'typescript/explicit-function-return-type',
  'ts/no-require-imports': 'typescript/no-require-imports',
  'unused-imports/no-unused-vars': 'unused-imports/no-unused-vars',
}

/** Every rule the Oxlint Emission sets to `off`, across all overrides. */
async function oxlintOffRules(options: Options = {}): Promise<Record<string, unknown>> {
  const config: OxlintConfig = await oxlint(houseOptions(options))
  const off: Record<string, unknown> = {}
  for (const override of config.overrides ?? []) {
    for (const [key, value] of Object.entries(override.rules ?? {})) {
      if (value === 'off') {
        off[key] = value
      }
    }
  }
  return off
}

describe('eslint() disables module', () => {
  it('emits Upstream\'s six rows, last of all Modules', async () => {
    const names = (await disablesObjects()).map(config => config.name)

    expect(names).toEqual([
      'lumirelle/disables/scripts',
      'lumirelle/disables/cli',
      'lumirelle/disables/bin',
      'lumirelle/disables/dts',
      'lumirelle/disables/cjs',
      'lumirelle/disables/config-files',
    ])
    const all = (await eslint(houseOptions({ type: 'lib' }))).map(config => config.name)
    expect(all.slice(-6)).toEqual(names)
  })

  it('covers the files Upstream covers, in the shared glob vocabulary', async () => {
    const [scripts, cli, bin, dts, cjs, configFiles] = await disablesObjects()

    expect(scripts?.files).toEqual([`**/scripts/${GLOB_SRC}`])
    expect(cli?.files).toEqual([`**/cli/${GLOB_SRC}`, `**/cli.${GLOB_SRC_EXT}`])
    expect(bin?.files).toEqual(['**/bin/**/*', `**/bin.${GLOB_SRC_EXT}`])
    expect(dts?.files).toEqual(['**/*.d.{ts,cts,mts}'])
    expect(cjs?.files).toEqual(['**/*.js', '**/*.cjs'])
    expect(configFiles?.files).toEqual([`**/*.config.${GLOB_SRC_EXT}`, `**/*.config.*.${GLOB_SRC_EXT}`])
  })

  it('turns every rule it carries off', async () => {
    const rules = (await disablesObjects({ type: 'lib' })).flatMap(config => Object.entries(config.rules ?? {}))

    expect(rules.length).toBeGreaterThan(0)
    for (const [key, value] of rules) {
      expect(value, key).toBe('off')
    }
  })

  it('keeps an entry only while another Module turned the rule on', async () => {
    const withoutImports = await disablesObjects({ imports: false })
    const withoutTypeScript = await disablesObjects({ typescript: false })
    const app = await disablesObjects()

    // `antfu/no-import-*` comes from the imports Module, `ts/no-require-imports` from typescript.
    expect(withoutImports.map(config => config.name)).not.toContain('lumirelle/disables/bin')
    expect(withoutTypeScript.map(config => config.name)).not.toContain('lumirelle/disables/cjs')
    // `ts/explicit-function-return-type` exists only for libraries.
    expect(app).toHaveLength(6)
    expect(Object.keys(app[0]!.rules ?? {})).not.toContain('ts/explicit-function-return-type')
    expect(Object.keys((await disablesObjects({ type: 'lib' }))[0]!.rules ?? {})).toContain('ts/explicit-function-return-type')
  })

  it('leaves out the rules of Modules that are not ported yet', async () => {
    const dts = (await disablesObjects()).find(config => config.name === 'lumirelle/disables/dts')

    // Upstream also disables `eslint-comments/no-unlimited-disable` here; the eslint-comments
    // Module is not part of Source yet, so nothing enables it and the entry stays out.
    expect(Object.keys(dts?.rules ?? {})).toEqual(['no-restricted-syntax', 'unused-imports/no-unused-vars'])
  })
})

describe('disables in both Emissions', () => {
  it('turns off, in Oxlint too, every rule it turns off in ESLint', async () => {
    const rules = (await disablesObjects({ type: 'lib' })).flatMap(config => Object.keys(config.rules ?? {}))
    const off = await oxlintOffRules({ type: 'lib' })
    const recorded = (coverageReport().modules.disables ?? []).map(entry => entry.key)

    // A new rule in the table must be given an Oxlint spelling here, or land in the report.
    expect([...new Set(rules)].sort()).toEqual(Object.keys(OXLINT_SPELLING).sort())

    for (const key of rules) {
      const spelling = OXLINT_SPELLING[key]
      if (spelling === undefined) {
        expect(recorded, key).toContain(key)
      }
      else {
        expect(off[spelling], key).toBe('off')
      }
    }
  })

  it('records the one rule Oxlint has no realization for', () => {
    expect(coverageReport().modules.disables).toEqual([
      { key: 'no-restricted-syntax', reason: 'unknown-rule' },
    ])
  })

  it('covers the same files on the Oxlint side, once its composer flattens the globs', async () => {
    const config = await oxlint(houseOptions({ type: 'lib' }))
    const disablesKeys = new Set(Object.values(OXLINT_SPELLING).filter(key => key !== undefined))
    // Oxlint config objects carry no name, so an override belongs to the table when every rule it
    // sets is one of the rules the table relaxes.
    const oxlintDisables = (config.overrides ?? []).filter((override) => {
      const keys = Object.keys(override.rules ?? {})
      return keys.length > 0 && keys.every(key => disablesKeys.has(key))
    })

    // One override per row: the dts row keeps one of its two rules, the other is recorded instead.
    expect(oxlintDisables.length).toBe(6)
    for (const sample of SAMPLES) {
      const fromEslint = new Set(
        (await disablesObjects({ type: 'lib' }))
          .filter(object => matches(sample, object.files ?? []))
          .flatMap(object => Object.keys(object.rules ?? {})),
      )
      const fromOxlint = new Set(
        oxlintDisables
          .filter(override => matches(sample, override.files ?? []))
          .flatMap(override => Object.keys(override.rules ?? {})),
      )
      const expected = [...fromEslint]
        .map(key => OXLINT_SPELLING[key])
        .filter((key): key is string => key !== undefined)

      expect([...fromOxlint].sort(), sample).toEqual(expected.sort())
    }
  })
})

/** Paths one row of the disables table is written for, plus two it must leave alone. */
const SAMPLES = [
  'scripts/tool.ts',
  'cli/main.js',
  'bin/cli.js',
  'types/index.d.ts',
  'lib/legacy.cjs',
  'vite.config.ts',
  'src/app.ts',
]

function matches(file: string, globs: readonly string[]): boolean {
  return globs.some(glob => minimatch(file, glob))
}
