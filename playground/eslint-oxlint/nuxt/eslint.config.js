// @ts-check
import { eslint } from '@lumirelle/linter-config/eslint'
import { options } from './options.ts'

// An example consumer of `@lumirelle/linter-config/eslint`: the options module is the only local
// input, and the package owns every rule, including the ones the starter used to get from the
// generated Nuxt ESLint config. The example does not set `oxlint: true`, so this Emission carries no
// Bridge; the `ts` example shows that option.
export default eslint(options)
