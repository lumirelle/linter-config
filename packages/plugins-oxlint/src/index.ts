import type { OxlintConfig } from 'oxlint'
import { fileURLToPath } from 'node:url'
import manifest from '../package.json' with { type: 'json' }

/**
 * The packages this Bundle ships, straight from its own manifest.
 *
 * A package it does not declare as a dependency is not its to resolve, however reachable that
 * package happens to be from this module.
 */
const shipped: ReadonlySet<string> = new Set(Object.keys(manifest.dependencies))

/** One of Oxlint's built-in plugins, as accepted by its `plugins` field. */
export type BuiltinPlugin = NonNullable<OxlintConfig['plugins']>[number]

/**
 * Built-in Oxlint plugins this configuration may enable.
 *
 * Oxlint ships these itself, so they need no package from this bundle. The names are Oxlint's own
 * scope names (`vitest`, not `test`), which is also how the rules read: `vitest/no-disabled-tests`.
 */
export const builtinPlugins: readonly BuiltinPlugin[] = [
  'import',
  'jsdoc',
  'jsx-a11y',
  'nextjs',
  'node',
  'react',
  'typescript',
  'unicorn',
  'vitest',
  'vue',
]

/**
 * ESLint plugins Oxlint can load through `jsPlugins`, keyed by Plugin id; the value is the package
 * name the id stands for. The alias Oxlint sees is the key itself, so supported rule keys are
 * identical in ESLint and Oxlint.
 *
 * The map is data, not the last word on the specifier: {@link resolveJsPlugin} turns an id into the
 * absolute path of the package this Bundle ships, and an id whose package this Bundle does not
 * depend on, such as a peer or one this Bundle predates, stays a bare package name for the consumer
 * to install.
 */
export const jsPlugins: Readonly<Record<string, string>> = {
  'antfu': 'eslint-plugin-antfu',
  'command': 'eslint-plugin-command',
  'e18e': '@e18e/eslint-plugin',
  'eslint-comments': '@eslint-community/eslint-plugin-eslint-comments',
  'perfectionist': 'eslint-plugin-perfectionist',
  'regexp': 'eslint-plugin-regexp',
  'slop': 'eslint-plugin-slop',
  'solid': 'eslint-plugin-solid',
  'sonar': 'eslint-plugin-sonarjs',
  'style': '@stylistic/eslint-plugin',
  'unocss': '@unocss/eslint-plugin',
  'unused-imports': 'eslint-plugin-unused-imports',
}

/**
 * Resolves a Plugin id to the absolute path of the package this Bundle ships for it.
 *
 * "Ships" means the package is one of this Bundle's own `dependencies`, read from its manifest: an
 * id whose package is not one of them, whether a peer, a blacklisted plugin, or an id a newer
 * registry knows and this Bundle does not, returns `undefined`, and the caller keeps the bare
 * package name.
 * Reachability is not the test: `import.meta.resolve` walks every ancestor `node_modules`, so a
 * hoisted copy or another workspace package's dependency would otherwise look like the Bundle's.
 */
export function resolveJsPlugin(id: string): string | undefined {
  const packageName = jsPlugins[id]
  if (!packageName || !shipped.has(packageName)) {
    return undefined
  }

  try {
    return fileURLToPath(import.meta.resolve(packageName))
  } catch {
    return undefined
  }
}
