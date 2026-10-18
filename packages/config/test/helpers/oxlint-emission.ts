import type { OxlintConfig } from 'oxlint'

/** Oxlint spells an unscoped override's scope as the match-all glob. */
const EVERY_FILE = '**/*'

/**
 * The rules the Emission sets for files with one of `extensions`, flattened the way Oxlint applies
 * them: an override without a scope applies everywhere, and Oxlint flattens Source's brace globs
 * into one pattern per extension, so a scope is matched on its extensions rather than on its text.
 */
export function rulesFor(config: OxlintConfig, extensions: readonly string[]): Record<string, unknown> {
  const scoped = (config.overrides ?? []).filter((override) => {
    const files = override.files ?? []
    return files.length > 0
      && files.every(file => file === EVERY_FILE || extensions.some(extension => file.endsWith(extension)))
  })

  const merged: Record<string, unknown> = {}
  Object.assign(merged, ...scoped.map(override => override.rules ?? {}))
  return merged
}
