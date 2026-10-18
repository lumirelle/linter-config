import type { OxlintConfig } from 'oxlint'

/** One of Oxlint's built-in plugins, as accepted by its `plugins` field. */
export type BuiltinPlugin = NonNullable<OxlintConfig['plugins']>[number]

/**
 * Built-in Oxlint plugins this configuration may enable.
 *
 * Oxlint ships these itself, so they need no package from this bundle.
 */
export const builtinPlugins: readonly BuiltinPlugin[] = []

/**
 * ESLint plugins loaded through Oxlint's `jsPlugins`, keyed by Plugin id; the value is
 * the specifier Oxlint resolves. The alias Oxlint sees is the key itself, so supported
 * rule keys are identical in ESLint and Oxlint.
 */
export const jsPlugins: Readonly<Record<string, string>> = {}
