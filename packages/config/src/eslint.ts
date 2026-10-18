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
 * The returned composer is thenable, so `eslint.config.js` can export it directly
 * without a top-level `await`, and it supports `append` / `override` / `remove` by
 * Config object name.
 *
 * @param options - Shared options; the same object configures {@link oxlint}.
 * @returns A composer that resolves to the ESLint Emission.
 * @throws when an {@link Options.overrides} key names a Config object that Source does not
 * emit, or when an override glob leaves the vocabulary both tools share
 */
export function eslint(options: Options = {}): FlatConfigComposer<Linter.Config, string> {
  return composeEslint(options)
}
