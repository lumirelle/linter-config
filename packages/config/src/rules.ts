import type { ConfigObject, RuleEntry, RuleKey } from './types'

/** Whether a rule entry turns its rule off; every other severity turns it on. */
function isRuleOff(entry: RuleEntry): boolean {
  const severity = Array.isArray(entry) ? entry[0] : entry
  return severity === 0 || severity === 'off'
}

/**
 * The rule keys a set of Config objects turns on.
 *
 * The Modules that disable rules owned by other Modules (`test`, `disables`) ask this instead of
 * restating Upstream's table, so they only turn off what this Source actually enabled: a Module
 * that is off, or not ported yet, leaves no `off` entry behind — which the Oxlint Emission would
 * otherwise have to declare a plugin for.
 */
export function enabledRuleKeys(configs: readonly ConfigObject[]): Set<RuleKey> {
  const enabled = new Set<RuleKey>()
  for (const config of configs) {
    for (const [key, entry] of Object.entries(config.rules ?? {}) as Array<[RuleKey, RuleEntry | undefined]>) {
      if (entry !== undefined && !isRuleOff(entry)) {
        enabled.add(key)
      }
    }
  }
  return enabled
}

/** The entries of `rules` whose rule one of `enabled` turns on, in their original order. */
export function rulesEnabledBy(
  rules: NonNullable<ConfigObject['rules']>,
  enabled: ReadonlySet<RuleKey>,
): NonNullable<ConfigObject['rules']> {
  const kept = Object.entries(rules).filter(([key]) => enabled.has(key))
  return Object.fromEntries(kept)
}
