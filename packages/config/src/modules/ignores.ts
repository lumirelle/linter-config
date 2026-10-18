import type { ConfigObject, Options } from '../types'
import { gitignorePatterns } from '../gitignore'
import { GLOB_EXCLUDE } from '../globs'

/**
 * Upstream's `configs/ignores.ts` and its gitignore support in one object: every global
 * ignore Source knows about.
 *
 * The object is domain-agnostic, so it carries `js` — the one domain both Adapters accept.
 * ESLint applies a `files`-less `ignores` object globally, and the Oxlint Adapter turns the
 * same list into `ignorePatterns`, which is also global.
 */
export function ignores(options: Pick<Options, 'gitignore' | 'ignores'> = {}): ConfigObject[] {
  const { gitignore = true, ignores: userIgnores = [] } = options

  return [
    {
      name: 'lumirelle/ignores',
      module: 'ignores',
      domain: 'js',
      ignores: [
        ...GLOB_EXCLUDE,
        ...gitignorePatterns(gitignore),
        ...userIgnores,
      ],
    },
  ]
}
