import type { Composer } from '@oxlint-flat-config/composer'
import type { Options } from './types'
import { composeOxlint } from './adapters/oxlint'

export type * from './types'

/**
 * Lumirelle's Oxlint config.
 *
 * Emits the same Modules as `eslint()`, through Oxlint's built-in `eslint`, `typescript`, `import`,
 * `node`, `unicorn`, `jsdoc`, `vitest`, `vue`, `react`, `jsx-a11y` and `nextjs` scopes and its
 * `jsPlugins` for everything else. A rule Oxlint cannot implement is left out of the Emission and
 * recorded in the committed Coverage report (`coverage.json`) with the reason, so a gap is never
 * silent.
 *
 * The `stylistic` Module is **off by default**, exactly as it is on the ESLint side: this project
 * formats with `oxfmt` (`objectWrap: 'preserve'`), so `@stylistic` would rewrap object literals the
 * formatter keeps. When a caller turns it on, `@stylistic/eslint-plugin` is loaded through
 * `jsPlugins` under the `style` alias, so its rule keys read the same in both tools.
 *
 * Two kinds of Module never reach Oxlint. `jsonc`, `yaml`, `toml` and `markdown` need a parser or a
 * processor Oxlint cannot add, and a rule that needs a TypeScript program runs here only in
 * Oxlint's own type-aware mode (`oxlint: { typeAware: true }`); by default every type-aware rule is
 * ESLint-only. Whatever Oxlint still lacks is recorded in the Coverage report as `eslint-only-domain`
 * or `type-aware`, never dropped quietly.
 *
 * A plugin is a package name, not something this package loads. The built-in scopes are Oxlint's
 * own, and every other Plugin id becomes a `jsPlugins` entry whose specifier Oxlint resolves from
 * the config file's directory, never from this package's `node_modules`; the consumer installs the
 * plugins of the Modules it enables, which for the default Modules is `eslint-plugin-antfu`,
 * `eslint-plugin-command`, `@e18e/eslint-plugin`, `eslint-plugin-perfectionist`,
 * `eslint-plugin-regexp` and `eslint-plugin-unused-imports`. A Module whose peer packages are
 * missing names them when it is enabled. Oxlint's `jsPlugins` are alpha and outside semver, so a JS
 * plugin can change behaviour between Oxlint releases even when this package does not.
 *
 * Config object names are public API, the same names `eslint()` emits: each one is
 * `lumirelle/<upstream tail>`, so `override` / `insertAfter` / `remove` address the same object
 * across upgrades. The single `jsPlugins` declaration is named `lumirelle/oxlint/jsPlugins`.
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
