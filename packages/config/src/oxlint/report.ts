import type { ModuleId, Options } from '../types'
import type { UnemittedRule } from './rule-map'
import { source } from '../source'
import { oxlintVersion } from './inventory'
import { mapRules } from './rule-map'

/**
 * What the Oxlint Emission cannot implement, per Module.
 *
 * The report describes the widest Source — every Module, and every optional slice the options can
 * add — so an option cannot hide a gap: a rule turns up here because Oxlint has no realization for
 * it, or because it needs a mode the Emission only turns on when asked. It is committed as
 * `coverage.json`, so a rule that stops being representable forces a review.
 */
export interface CoverageReport {
  /** The Oxlint version the rule inventory — and so this report — was generated from. */
  oxlintVersion: string
  modules: Partial<Record<ModuleId, UnemittedRule[]>>
}

/**
 * The Source the report is computed from: the type-aware TypeScript block, the peer
 * `erasableOnly` plugin, the `lib` rule set and the stylistic slices are the option-dependent
 * parts of Source, and all of them stay visible here.
 *
 * `gitignore` and `isInEditor` are pinned because they read the environment, not a Module.
 */
const WIDEST_SOURCE: Options = {
  gitignore: false,
  isInEditor: false,
  stylistic: true,
  type: 'lib',
  typescript: { erasableOnly: true, tsconfigPath: 'tsconfig.json' },
}

/**
 * The rules the Oxlint Emission drops, grouped by Module.
 *
 * `eslint-only-domain` is the reason for the Modules Oxlint cannot read at all (data and markup
 * Domains); the Adapter filters those out before mapping, so no rule of the first slice carries
 * it yet.
 */
export function coverageReport(): CoverageReport {
  const modules: CoverageReport['modules'] = {}

  for (const config of source(WIDEST_SOURCE)) {
    for (const rule of mapRules(config.rules).unemitted) {
      const collected = modules[config.module] ?? []
      if (!collected.some(entry => entry.key === rule.key && entry.reason === rule.reason)) {
        collected.push(rule)
      }
      modules[config.module] = collected
    }
  }

  return {
    oxlintVersion,
    modules: Object.fromEntries(
      Object.entries(modules)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([module, rules]) => [
          module,
          [...rules].sort((left, right) => left.key.localeCompare(right.key)),
        ]),
    ) as CoverageReport['modules'],
  }
}
