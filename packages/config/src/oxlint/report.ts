import type { ModuleId, Options, PluginId } from '../types'
import type { BlacklistEntry } from './blacklist'
import type { UnemittedRule } from './rule-map'
import { PLUGIN_IDS } from '../plugins'
import { source } from '../source'
import { OXLINT_BLACKLIST } from './blacklist'
import { isOxlintDomain } from './domains'
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
  /** The Plugin ids the Emission's one `jsPlugins` declaration aliases, in registry order. */
  jsPlugins: PluginId[]
  /**
   * The Plugins the Emission refuses to load, with the failure that put them here. Source may not
   * use them yet; the report carries them so adding a rule of a dead plugin cannot look like a
   * new gap, and so the reason is reviewable next to the gaps it causes.
   */
  blacklist: BlacklistEntry[]
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
 * `eslint-only-domain` is the reason for the Modules Oxlint cannot read at all (the data and
 * markup Domains): the Adapter filters those Config objects out before mapping, so the report
 * reads every one of their rules under that reason rather than inventing a per-rule analysis.
 */
export function coverageReport(): CoverageReport {
  const modules: CoverageReport['modules'] = {}
  const jsPlugins = new Set<PluginId>()

  for (const config of source(WIDEST_SOURCE)) {
    if (!isOxlintDomain(config.domain)) {
      record(
        modules,
        config.module,
        Object.keys(config.rules ?? {}).map(key => ({ key, reason: 'eslint-only-domain' })),
      )
      continue
    }

    for (const rule of mapRules(config.rules).unemitted) {
      record(modules, config.module, [rule])
    }
    for (const id of mapRules(config.rules).jsPlugins) {
      jsPlugins.add(id)
    }
  }

  return {
    oxlintVersion,
    jsPlugins: PLUGIN_IDS.filter(id => jsPlugins.has(id)),
    blacklist: [...OXLINT_BLACKLIST].sort((left, right) => left.id.localeCompare(right.id)),
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

/** Collects one Module's dropped rules, keeping one entry per key and reason. */
function record(
  modules: CoverageReport['modules'],
  module: ModuleId,
  rules: UnemittedRule[],
): void {
  const collected = modules[module] ?? []
  for (const rule of rules) {
    if (!collected.some(entry => entry.key === rule.key && entry.reason === rule.reason)) {
      collected.push(rule)
    }
  }
  modules[module] = collected
}
