import type { Linter } from 'eslint'
import type { FlatConfigComposer } from 'eslint-flat-config-utils'
import type { Options } from './types'
import { composeEslint } from './adapters/eslint'

export type * from './types'

/**
 * Lumirelle's ESLint flat config.
 *
 * Emits Source's Modules in order: one global `ignores` object (house excludes, the
 * project's `.gitignore` when {@link Options.gitignore} is on, and {@link Options.ignores}),
 * the shared language setup and house rules for JavaScript and TypeScript, then the `node`,
 * `jsdoc`, `imports`, `unicorn` and `test` Modules, and last the `disables` Module, which
 * relaxes rules for scripts, CLIs, bins, declaration files, CommonJS entry points and config
 * files. Autofixable rules report as warnings inside an editor, which {@link Options.isInEditor}
 * detects or overrides.
 *
 * The `stylistic` Module is the one Module that is **off by default**: this project formats with
 * `oxfmt`, whose `objectWrap: 'preserve'` keeps object literals on one line where the author put
 * them, while `@stylistic` would rewrap them — the two would fight over the same characters.
 * Turning it on is opt-in: `stylistic: true`, or its object form for the module's `customize()`
 * options.
 *
 * Two kinds of Module only reach ESLint. `jsonc`, `yaml`, `toml` and `markdown` need a parser or a
 * processor, and a rule that needs a TypeScript program only runs where there is one: Oxlint has no
 * parser hook and reads type information only in its own type-aware mode, so by default every
 * type-aware rule is ESLint-only. This Emission emits all of them; the Oxlint Emission records the
 * ones it cannot implement in the Coverage report as `eslint-only-domain` or `type-aware`.
 *
 * Plugins are never a direct dependency here: the ESLint plugin objects Source references by
 * Plugin id come from the optional peer `@lumirelle/linter-plugins-eslint`, and the packages
 * Upstream declares as optional peers (framework and language plugins, parsers, formatters) stay
 * the consumer's to install. Enabling a Module whose packages are missing throws an error naming
 * every package to install.
 *
 * Config object names are public API. Each one is `lumirelle/<upstream tail>` and stays stable once
 * published, because `override` / `remove` and the Upstream comparison address objects by name.
 *
 * The returned composer is thenable, so `eslint.config.js` can export it directly
 * without a top-level `await`, and it supports `append` / `override` / `remove` by
 * Config object name.
 *
 * With {@link Options.oxlint} set, the Bridge closes the Emission: one config object per Config
 * object the Oxlint Emission takes, turning off the rules Oxlint reports, in the same file scopes.
 * That is what keeps a project running both tools from reporting the same violation twice.
 * `eslint()` without it emits no Bridge, and there is no second call to make: the factory owns the
 * Bridge's position, so Config objects appended after the factory still resolve before it.
 *
 * @param options - Shared options; the same object configures {@link oxlint}.
 * @returns A composer that resolves to the ESLint Emission.
 * @throws when an {@link Options.overrides} key names a Config object that Source does not
 * emit, or when an override glob leaves the vocabulary both tools share
 */
export function eslint(options: Options = {}): FlatConfigComposer<Linter.Config, string> {
  return composeEslint(options)
}
