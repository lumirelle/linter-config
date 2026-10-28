// @ts-check
import { oxlint } from '@lumirelle/linter-config/oxlint'
import { options } from './options.ts'

// The same Source as `eslint.config.js`, emitted for Oxlint.
export default oxlint(options)
