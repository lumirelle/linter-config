import type { Composer } from '@oxlint-flat-config/composer'
import type { Options } from './types'
import { composeOxlint } from './adapters/oxlint'

export type * from './types'

/**
 * Lumirelle's Oxlint config.
 *
 * The returned composer is thenable, so `oxlint.config.ts` can `export default oxlint()`
 * and Oxlint resolves it without a top-level `await`, the same way it works on the ESLint
 * side.
 *
 * @param options - Shared options; the same object configures {@link eslint}.
 * @returns A composer that resolves to the Oxlint Emission.
 */
export function oxlint(options: Options = {}): Composer {
  return composeOxlint(options)
}
