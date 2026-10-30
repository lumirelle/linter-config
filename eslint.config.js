// @ts-check
import { eslint } from '@lumirelle/linter-config/eslint'
import { options } from './config/linter.ts'

// The repository's own ESLint config, and the reference consumer of
// `@lumirelle/linter-config/eslint`: the package owns every rule, so the only local decisions are
// the ones a consumer genuinely has to make, and they live in `config/linter.ts` because
// `oxlint.config.ts` has to pass the very same ones.
//
// The `oxlint` option makes the Bridge the last part of this Emission: every rule Oxlint reports
// is turned off here, in the same file scopes.
export default eslint(options)
