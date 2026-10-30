import type { ConfigObject, Options } from '../types'
import { gitignorePatterns } from '../gitignore'
import { GLOB_EXCLUDE } from '../globs'

export function ignores(options: Pick<Options, 'gitignore' | 'ignores'> = {}): ConfigObject[] {
  const { gitignore = true, ignores: userIgnores = [] } = options

  return [
    {
      name: 'lumirelle/ignores',
      module: 'ignores',
      domain: 'js',
      ignores: [...GLOB_EXCLUDE, ...gitignorePatterns(gitignore), ...userIgnores],
    },
  ]
}
