import type { FlatGitignoreOptions, Glob } from './types'
import gitignore from 'eslint-config-flat-gitignore'
import { globVocabularyViolation } from './globs'

/**
 * The ignore globs a project's `.gitignore` files contribute, as data.
 *
 * `strict` defaults to `false`, so a project without a `.gitignore` gets no patterns
 * instead of a throw; a caller that wants the throw should passes `strict: true`.
 *
 * LIMITATION: A gitignore negation (`!.env.example`) un-ignores a file in git and in ESLint's global
 * ignores, but neither Oxlint's `ignorePatterns` nor the shared glob vocabulary can express
 * it. Those patterns are dropped: the shared list keeps the positive ignores both tools
 * understand.
 */
export function gitignorePatterns(options: boolean | FlatGitignoreOptions = true): Glob[] {
  if (options === false) {
    return []
  }

  const { ignores } = gitignore({ strict: false, ...(options === true ? {} : options) })
  return ignores.filter(pattern => globVocabularyViolation(pattern) === undefined)
}
