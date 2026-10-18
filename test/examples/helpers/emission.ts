import type { ModuleId, Options } from '@lumirelle/linter-config/eslint'
import type { Linter } from 'eslint'
import type { OxlintConfig } from 'oxlint'
import { resolveExample } from '../../../playground/examples'

/** One example's two Emissions plus the options module both are built from. */
export interface ExampleEmissions {
  options: Options
  eslint: readonly Linter.Config[]
  oxlint: OxlintConfig
}

/**
 * Load one example exactly as `mise run play` does: through the registry, which imports the
 * example's own config modules, so the Emission is the one a consumer's file would build.
 *
 * The assertions read Config object names rather than pinning `.gitignore` discovery and editor
 * detection the way `houseOptions()` does for the repository's own config: those two inputs change
 * ignore contents and rule severities, never the names, and an example's options module stays the
 * consumer-realistic object a reader copies.
 */
export async function loadExample(name: string): Promise<ExampleEmissions> {
  const example = await resolveExample(name)
  return { options: example.options, eslint: example.eslint, oxlint: example.oxlint }
}

/** The Config object names an ESLint Emission carries, in emission order. */
export function configNames(configs: readonly Linter.Config[]): string[] {
  return configs.flatMap(config => config.name === undefined ? [] : [config.name])
}

/** The Config object names an ESLint Emission carries for `module`. */
export function objectsOfModule(configs: readonly Linter.Config[], module: ModuleId): string[] {
  return configNames(configs).filter(name => name.startsWith(`lumirelle/${module}/`))
}
