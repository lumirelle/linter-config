import type { FlatGitignoreOptions, Glob } from './types'
import gitignore from 'eslint-config-flat-gitignore'
import { globVocabularyViolation } from './globs'

/**
 * The ignore globs a project's `.gitignore` files contribute, as data.
 *
 * `eslint-config-flat-gitignore` is a data package: it answers "which globs would git
 * ignore", and returns them in an ESLint config object whose `ignores` we take, so no
 * tool-specific config object reaches Source.
 *
 * `strict` defaults to `false`, so a project without a `.gitignore` gets no patterns
 * instead of a throw; a caller that wants the throw passes `strict: true`.
 *
 * A gitignore negation (`!.env.example`) un-ignores a file in git and in ESLint's global
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
