import type { ConfigObject, RuleEntry, RuleKey } from '../types'
import { pluginDefinition, pluginIdOfRuleKey } from '../plugins'
import { findOxlintRule } from './inventory'

/**
 * Why the Oxlint Emission cannot implement a rule.
 *
 * - `unknown-rule`: Oxlint has no rule of that name in the scope the Emission emits it through;
 *   for a core rule that is the unprefixed `eslint` scope, so `dot-notation` lands here even
 *   though Oxlint spells it `typescript/dot-notation` in its type-aware mode.
 * - `type-aware`: the rule only runs in Oxlint's type-aware mode, which the caller did not turn on.
 * - `no-oxlint-realization`: the Plugin id has neither a built-in scope nor a `jsPlugins` entry.
 * - `eslint-only-domain`: the rule belongs to a Domain Oxlint cannot read (no parser, no processor).
 * - `incompatible-options`: Oxlint implements the rule but rejects the options Source gives it, so
 *   emitting it would make the whole Oxlint config unloadable.
 * - `renamed-rule`: Oxlint implements the rule under a different name, recorded in `oxlint`; the
 *   Emission cannot emit it, because a built-in scope only reads its own names.
 */
type CoverageReason
  = | 'unknown-rule'
    | 'type-aware'
    | 'no-oxlint-realization'
    | 'eslint-only-domain'
    | 'incompatible-options'
    | 'renamed-rule'

/** A rule key the Oxlint Emission had to leave out, with the reason it did. */
export interface UnemittedRule {
  key: RuleKey
  reason: CoverageReason
  /** For `renamed-rule`: the key Oxlint reads the same rule under. */
  oxlint?: string
}

export interface RuleMapping {
  /** The rules that survived, keyed the way Oxlint spells them. */
  rules?: Partial<Record<string, RuleEntry>>
  /** The rules that did not, in Source order; the Coverage report derives from this. */
  unemitted: UnemittedRule[]
}

/**
 * Source rules whose options Oxlint's own schema rejects.
 *
 * `eslint-plugin-import-lite` spells the option of `consistent-type-specifier-style` `top-level`,
 * while Oxlint's forked schema only accepts `prefer-top-level` / `prefer-inline`. Oxlint refuses
 * the whole config over one unknown option value, so the rule is left to ESLint and recorded in
 * the Coverage report instead of making the Emission unloadable.
 */
const INCOMPATIBLE_OPTIONS: ReadonlySet<RuleKey> = new Set<RuleKey>([
  'import/consistent-type-specifier-style',
])

/**
 * Source rules Oxlint implements under another name.
 *
 * `test/no-only-tests` comes from `eslint-plugin-no-only-tests`, which Upstream merges into the
 * `test` plugin; Oxlint's built-in `vitest` scope calls the same check `no-focused-tests`. The
 * Emission keeps Source's key rather than translating the rule, so the Coverage report names the
 * Oxlint spelling for a reviewer to judge.
 */
const RENAMED_RULES: ReadonlyMap<RuleKey, string> = new Map<RuleKey, string>([
  ['test/no-only-tests', 'vitest/no-focused-tests'],
])

/**
 * Maps Source rule keys onto the keys Oxlint reads.
 *
 * A core rule keeps its key, because Oxlint's built-in `eslint` scope is unprefixed, but only
 * when the committed inventory has it: a rule Oxlint does not implement would otherwise make the
 * whole config unloadable. A Plugin id with a built-in scope emits `scope/rule` the same way; one
 * that only has a `jsPlugins` package emits `alias/rule`, which Oxlint resolves through the
 * declared alias, and one with neither is dropped.
 */
export function mapRules(
  rules: ConfigObject['rules'],
  { typeAware = false }: { typeAware?: boolean } = {},
): RuleMapping {
  const mapped: Partial<Record<string, RuleEntry>> = {}
  const unemitted: UnemittedRule[] = []

  for (const key of Object.keys(rules ?? {}) as RuleKey[]) {
    const entry = rules?.[key]
    if (entry === undefined) {
      continue
    }

    const id = pluginIdOfRuleKey(key)
    if (INCOMPATIBLE_OPTIONS.has(key)) {
      unemitted.push({ key, reason: 'incompatible-options' })
      continue
    }

    const renamedTo = RENAMED_RULES.get(key)
    if (renamedTo) {
      unemitted.push({ key, oxlint: renamedTo, reason: 'renamed-rule' })
      continue
    }

    if (!id) {
      if (findOxlintRule('eslint', key)) {
        mapped[key] = entry
      }
      else {
        unemitted.push({ key, reason: 'unknown-rule' })
      }
      continue
    }

    const definition = pluginDefinition(id).oxlint
    const rule = key.slice(id.length + 1)

    if (definition?.builtin) {
      const known = findOxlintRule(definition.builtin, rule)
      if (!known) {
        unemitted.push({ key, reason: 'unknown-rule' })
      }
      else if (known.typeAware && !typeAware) {
        unemitted.push({ key, reason: 'type-aware' })
      }
      else {
        mapped[`${definition.builtin}/${rule}`] = entry
      }
      continue
    }

    if (definition?.alias) {
      mapped[`${definition.alias}/${rule}`] = entry
      continue
    }

    unemitted.push({ key, reason: 'no-oxlint-realization' })
  }

  return { rules: Object.keys(mapped).length > 0 ? mapped : undefined, unemitted }
}
