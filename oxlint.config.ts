// @ts-check
import { oxlint } from '@lumirelle/linter-config/oxlint'
import { options } from './lint-options.ts'

// The repository's own Oxlint config: the same Source as `eslint.config.js`, emitted for Oxlint,
// from the one options object both configs share. Oxlint discovers this file without a `-c` flag,
// which is why `hk` needs no extra arguments and why `.oxlintrc.json` had to go — Oxlint refuses
// to load both.
export default oxlint(options)
