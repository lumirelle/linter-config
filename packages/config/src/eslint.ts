import type { Linter } from 'eslint'
import type { FlatConfigComposer } from 'eslint-flat-config-utils'
import type { Options } from './types'
import { composeEslint } from './adapters/eslint'

export type * from './types'

/**
 * Lumirelle's ESLint flat config.
 *
 * The returned composer is thenable, so `eslint.config.js` can export it directly
 * without a top-level `await`, and it supports `append` / `override` / `remove` by
 * Config object name.
 *
 * @param options - Shared options; the same object configures {@link oxlint}.
 * @returns A composer that resolves to the ESLint Emission.
 */
export function eslint(options: Options = {}): FlatConfigComposer<Linter.Config, string> {
  return composeEslint(options)
}
