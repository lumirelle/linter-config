import type { ConfigObject, Domain } from '../types'

/**
 * The Domains Oxlint can read: JavaScript/TypeScript/JSX plus Vue single-file components.
 *
 * Oxlint has no parser or processor hook, so every other Domain is ESLint-only; the Oxlint
 * Adapter filters on this list before mapping any rule, and the Coverage report records what
 * the filter leaves behind.
 */
const OXLINT_DOMAINS: readonly Domain[] = ['js', 'vue']

/** Whether the Oxlint Emission can carry Config objects of that Domain. */
export function isOxlintDomain(domain: Domain): boolean {
  return OXLINT_DOMAINS.includes(domain)
}

/**
 * Whether the Oxlint Emission takes this Config object: a Domain it can read, and no
 * `tools.oxlint: false` opt-out. The Adapter and the Bridge both filter on this one answer, so a
 * Config object is either in both Emissions or in neither.
 */
export function isOxlintConfig(config: ConfigObject): boolean {
  return isOxlintDomain(config.domain) && config.tools?.oxlint !== false
}
