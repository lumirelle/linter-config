// @ts-check
import { oxlint } from '@lumirelle/linter-config/oxlint'
import { options } from './options.ts'

// The same Source as `eslint.config.js`, emitted for Oxlint, from the one options object both
// configs share. Oxlint discovers this file without a `-c` flag; do not keep an `.oxlintrc.json`
// beside it, because Oxlint refuses to load both.
export default oxlint(options)
