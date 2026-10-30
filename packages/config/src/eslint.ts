import type { Linter } from 'eslint'
import type { FlatConfigComposer } from 'eslint-flat-config-utils'
import type { Options } from './types'
import { composeEslint } from './adapters/eslint'

export type * from './types'

/**
 * Lumirelle's ESLint flat config factory.
 *
 * With {@link Options.oxlint} set, the rules {@link oxlint} can provides will turn off inside this factory.
 *
 * @param options - Shared options; the same object configures {@link oxlint}.
 * @returns A composer that resolves to the ESLint config emission.
 */
export function eslint(options: Options = {}): FlatConfigComposer<Linter.Config, string> {
  return composeEslint(options)
}
