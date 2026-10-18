import { describe, expect, it } from 'vitest'
import { readOxlintRules } from '../scripts/oxlint-rules'
import { oxlintRules, oxlintVersion } from '../src/oxlint/inventory'

const REGENERATE = 'The committed Oxlint inventory no longer matches the installed Oxlint; '
  + 'run `mise run //packages/config:inventory` and commit the result.'

/** One comparable form of a rule, so a failure names the rules that changed instead of dumping 871 rows. */
function signature(rule: { scope: string, rule: string, typeAware: boolean }): string {
  return `${rule.scope}/${rule.rule}${rule.typeAware ? ' (type-aware)' : ''}`
}

describe('the committed Oxlint rule inventory', () => {
  it('was generated from the installed Oxlint version', () => {
    const installed = readOxlintRules()

    expect(oxlintVersion, REGENERATE).toBe(installed.version)
  })

  it('lists exactly the rules the installed Oxlint reports', () => {
    const committed = new Set(oxlintRules().map(signature))
    const installed = new Set(readOxlintRules().rules.map(signature))

    expect([...installed].filter(rule => !committed.has(rule)), REGENERATE).toEqual([])
    expect([...committed].filter(rule => !installed.has(rule)), REGENERATE).toEqual([])
  })

  it('agrees with the installed Oxlint on which rules are type-aware', () => {
    const typeAware = (rules: { scope: string, rule: string, typeAware: boolean }[]): string[] =>
      rules.filter(rule => rule.typeAware).map(signature).sort()

    expect(typeAware(oxlintRules()), REGENERATE).toEqual(typeAware(readOxlintRules().rules))
  })

  it('keeps the scopes spelled the way Oxlint configs spell them', () => {
    const scopes = new Set(oxlintRules().map(rule => rule.scope))

    expect(scopes).toContain('jsx-a11y')
    expect([...scopes].some(scope => scope.includes('_'))).toBe(false)
  })
})
