export type * from './types'

/**
 * The package's root entry: the option types, and nothing at runtime.
 *
 * `Options` configures both factories, so a project that shares one options module between its
 * ESLint and Oxlint config files should not have to name one tool to get the type. Naming it here
 * says what it is: both Emissions' input, not a per-tool option bag.
 *
 * The factories stay on their own specifiers, `@lumirelle/linter-config/eslint` and
 * `@lumirelle/linter-config/oxlint`, each with the Composer type of its own tool. This module has
 * no runtime exports at all, so importing it cannot pull either Adapter.
 */
