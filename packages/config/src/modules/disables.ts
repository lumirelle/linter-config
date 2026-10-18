import type { ConfigObject, Glob } from '../types'
import { GLOB_SRC, GLOB_SRC_EXT } from '../globs'
import { enabledRuleKeys, rulesEnabledBy } from '../rules'

/** One row of Upstream's disables table: the files it covers and the rules it relaxes there. */
interface Disable {
  name: string
  files: Glob[]
  rules: NonNullable<ConfigObject['rules']>
}

/**
 * Upstream's disables table, verbatim: code that is not library code — scripts, CLIs, bins,
 * declaration files, CommonJS entry points and config files — is allowed to do what the house
 * rules otherwise forbid.
 */
const DISABLES: readonly Disable[] = [
  {
    name: 'lumirelle/disables/scripts',
    files: [`**/scripts/${GLOB_SRC}`],
    rules: {
      'antfu/no-top-level-await': 'off',
      'no-console': 'off',
      'ts/explicit-function-return-type': 'off',
    },
  },
  {
    name: 'lumirelle/disables/cli',
    files: [`**/cli/${GLOB_SRC}`, `**/cli.${GLOB_SRC_EXT}`],
    rules: {
      'antfu/no-top-level-await': 'off',
      'no-console': 'off',
    },
  },
  {
    name: 'lumirelle/disables/bin',
    files: ['**/bin/**/*', `**/bin.${GLOB_SRC_EXT}`],
    rules: {
      'antfu/no-import-dist': 'off',
      'antfu/no-import-node-modules-by-path': 'off',
    },
  },
  {
    name: 'lumirelle/disables/dts',
    files: ['**/*.d.{ts,cts,mts}'],
    rules: {
      'eslint-comments/no-unlimited-disable': 'off',
      'no-restricted-syntax': 'off',
      'unused-imports/no-unused-vars': 'off',
    },
  },
  {
    name: 'lumirelle/disables/cjs',
    files: ['**/*.js', '**/*.cjs'],
    rules: {
      'ts/no-require-imports': 'off',
    },
  },
  {
    name: 'lumirelle/disables/config-files',
    files: [`**/*.config.${GLOB_SRC_EXT}`, `**/*.config.*.${GLOB_SRC_EXT}`],
    rules: {
      'antfu/no-top-level-await': 'off',
      'no-console': 'off',
      'ts/explicit-function-return-type': 'off',
    },
  },
]

/**
 * Upstream's `configs/disables.ts`: the last word, so it can override every Module above it.
 *
 * Upstream hard-codes the table. Source derives it from `configs`, the Config objects composed so
 * far, so a rule is turned off only where this Source turned it on: a Module the caller switched
 * off, or one not ported yet, leaves no entry behind and a row with nothing left to disable is
 * dropped altogether. Both keep the Oxlint Emission free of plugins no rule needs.
 */
export function disables(configs: readonly ConfigObject[]): ConfigObject[] {
  const enabled = enabledRuleKeys(configs)

  return DISABLES.flatMap((disable) => {
    const rules = rulesEnabledBy(disable.rules, enabled)
    if (Object.keys(rules).length === 0) {
      return []
    }
    return [{
      name: disable.name,
      module: 'disables',
      domain: 'js',
      files: disable.files,
      rules,
    }]
  })
}
