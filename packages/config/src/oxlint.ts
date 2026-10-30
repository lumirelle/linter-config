import type { Composer } from '@oxlint-flat-config/composer'
import type { Options } from './types'
import { composeOxlint } from './adapters/oxlint'

export type * from './types'

/**
 * Lumirelle's Oxlint config factory.
 *
 * @param options - Shared options; the same object configures {@link eslint}.
 * @returns A composer that resolves to the Oxlint config emission.
 */
export function oxlint(options: Options = {}): Composer {
  return composeOxlint(options)
}
