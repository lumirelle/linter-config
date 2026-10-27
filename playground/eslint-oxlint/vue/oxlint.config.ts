// @ts-check
import { oxlint } from '@lumirelle/linter-config/oxlint'
import { options } from './options.ts'

// The same Source as `eslint.config.js`, emitted for Oxlint, from the one options object both
// configs share. Oxlint discovers this file without a `-c` flag; a project carries either this
// file or an `.oxlintrc.json`, never both.
export default oxlint(options)
