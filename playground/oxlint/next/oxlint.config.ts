// @ts-check
import { oxlint } from '@lumirelle/linter-config/oxlint'
import { options } from './options.ts'

// The Oxlint Emission of the options module this flavor ships. Oxlint discovers this file without a
// `-c` flag; do not keep an `.oxlintrc.json` beside it, because Oxlint refuses to load both.
export default oxlint(options)
