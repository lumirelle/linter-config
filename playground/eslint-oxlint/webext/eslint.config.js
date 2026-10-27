// @ts-check
import { eslint } from '@lumirelle/linter-config/eslint'
import { options } from './options.ts'

// An example consumer of `@lumirelle/linter-config/eslint`: the options module is the only local
// input, and the package owns every rule.
export default eslint(options)
