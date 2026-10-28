// @ts-check
import { oxlint } from '@lumirelle/linter-config/oxlint'

// An example consumer of `@lumirelle/linter-config/oxlint`.
export default oxlint({
  // A library, not an application: the library-specific slices of the `node`, `e18e` and
  // TypeScript Modules are enabled.
  type: 'lib',
  // too, because the entry describes the stack rather than the linter this example ships.
  // Type-aware rules need the project's TypeScript config, on both sides: Oxlint reads them in its
  // own type-aware mode, which is what makes the `oxlint` object below more than a Bridge flag.
  typescript: { tsconfigPath: 'tsconfig.json' },
  oxlint: { typeAware: true },
})
