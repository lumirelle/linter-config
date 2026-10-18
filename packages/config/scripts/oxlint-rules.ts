import type { OxlintRule } from '../src/oxlint/inventory'
import { execFileSync } from 'node:child_process'
import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'
import process from 'node:process'

const require = createRequire(import.meta.url)

/** The shape `oxlint --rules --format json` prints, as far as the inventory reads it. */
interface OxlintRuleReport {
  scope: string
  value: string
  type_aware: boolean
}

/**
 * Reads the rules of the installed Oxlint by running the binary's own `--rules --format json`.
 *
 * This is build and test tooling, not Source: the inventory is data, and Source never runs Oxlint.
 */
export function readOxlintRules(): { version: string, rules: OxlintRule[] } {
  const packagePath = require.resolve('oxlint/package.json')
  const version = (require(packagePath) as { version: string }).version
  const output = execFileSync(
    process.execPath,
    [join(dirname(packagePath), 'bin', 'oxlint'), '--rules', '--format', 'json'],
    { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 },
  )

  return { version, rules: normalize(JSON.parse(output)) }
}

/**
 * Turns the report into the committed inventory shape: scopes spelled the way Oxlint configs
 * spell them (`jsx_a11y` -> `jsx-a11y`) and a stable order, so a regeneration only diffs on rules.
 */
function normalize(parsed: unknown): OxlintRule[] {
  if (!Array.isArray(parsed) || parsed.length === 0) {
    throw new TypeError(
      '`oxlint --rules --format json` no longer prints an array of rules. '
      + 'Update `packages/config/scripts/oxlint-rules.ts` against the installed Oxlint before regenerating the inventory.',
    )
  }

  const rules = parsed.map((entry, index) => {
    const { scope, value, type_aware: typeAware } = (entry ?? {}) as Partial<OxlintRuleReport>
    if (typeof scope !== 'string' || typeof value !== 'string' || typeof typeAware !== 'boolean') {
      throw new TypeError(
        `Rule #${index} of \`oxlint --rules --format json\` is not \`{ scope, value, type_aware }\`: `
        + `${JSON.stringify(entry)}. Update \`packages/config/scripts/oxlint-rules.ts\` against the installed Oxlint.`,
      )
    }
    return { scope: scope.replaceAll('_', '-'), rule: value, typeAware }
  })

  return rules.sort((left, right) => left.scope.localeCompare(right.scope) || left.rule.localeCompare(right.rule))
}
