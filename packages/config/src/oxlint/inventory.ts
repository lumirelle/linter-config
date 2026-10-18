import { OXLINT_RULES, OXLINT_VERSION } from './inventory.generated'

/** One rule row of the generated inventory, as committed. */
export type OxlintRuleRow = readonly [scope: string, rule: string, typeAware: boolean]

/** One Oxlint rule the Oxlint Emission may reference. */
export interface OxlintRule {
  scope: string
  rule: string
  /** Oxlint only runs the rule when its type-aware mode is on. */
  typeAware: boolean
}

/** The Oxlint version the committed inventory was generated from. */
export const oxlintVersion: string = OXLINT_VERSION

const rulesByScope = new Map<string, Map<string, OxlintRule>>()
for (const [scope, rule, typeAware] of OXLINT_RULES) {
  let group = rulesByScope.get(scope)
  if (!group) {
    group = new Map()
    rulesByScope.set(scope, group)
  }
  group.set(rule, { scope, rule, typeAware })
}

/** Every rule of that Oxlint version, in inventory order (scope, then rule). */
export function oxlintRules(): OxlintRule[] {
  return [...rulesByScope.values()].flatMap(group => [...group.values()])
}

/** The inventory entry for one `scope/rule`, or `undefined` when Oxlint does not know it. */
export function findOxlintRule(scope: string, rule: string): OxlintRule | undefined {
  return rulesByScope.get(scope)?.get(rule)
}
