import type { ConfigObject, Glob, Options } from './types'
import { assertGlobVocabulary } from './globs'

/**
 * Composes every Module into Source's Config objects; the only input to both Adapters.
 *
 * Modules (`src/modules/<module>.ts`) land in later tickets, so Source is empty for now
 * and both Emissions stay valid but rule-free.
 */
export function source(_options: Options = {}): ConfigObject[] {
  const configs: ConfigObject[] = []

  // Invariant: a glob must work in both tools, so Source rejects anything outside the
  // shared vocabulary before an Adapter ever sees it.
  assertGlobVocabulary(configs.flatMap(config => [...(config.files ?? []), ...(config.ignores ?? [])] as Glob[]))

  return configs
}
