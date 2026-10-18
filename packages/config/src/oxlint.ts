import type { Composer } from '@oxlint-flat-config/composer'
import type { Options } from './types'
import { composeOxlint } from './adapters/oxlint'

export type * from './types'

/**
 * Lumirelle's Oxlint config.
 *
 * Emits the same Modules as `eslint()`, through Oxlint's built-in `eslint`, `typescript`,
 * `node`, `jsdoc`, `import` and `vitest` scopes and its `jsPlugins` for everything else. A rule
 * Oxlint cannot implement is left out of the Emission and recorded in the committed Coverage
 * report (`coverage.json`) with the reason, so a gap is never silent.
 *
 * The `stylistic` Module is **off by default**, exactly as it is on the ESLint side: this project
 * formats with `oxfmt` (`objectWrap: 'preserve'`), so `@stylistic` would rewrap object literals the
 * formatter keeps. When a caller turns it on, `@stylistic/eslint-plugin` is loaded through
 * `jsPlugins` under the `style` alias, so its rule keys read the same in both tools.
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
