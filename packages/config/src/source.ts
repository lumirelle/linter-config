import type { ConfigObject, Options } from './types'

/**
 * Composes every Module into Source's Config objects; the only input to both Adapters.
 *
 * Modules (`src/modules/<module>.ts`) land in later tickets, so Source is empty for now
 * and both Emissions stay valid but rule-free.
 */
export function source(_options: Options = {}): ConfigObject[] {
  return []
}
