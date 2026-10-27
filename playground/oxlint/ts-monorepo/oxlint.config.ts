// @ts-check
import { oxlint } from '@lumirelle/linter-config/oxlint'
import { options } from './options.ts'

// The Oxlint Emission of the workspace's one options module, at the workspace root: every package
// under `packages/` is linted from this file, and a package's deviation is an `overrides` entry in
// `options.ts`, not a second config. Oxlint discovers this file without a `-c` flag; do not keep an
// `.oxlintrc.json` beside it, because Oxlint refuses to load both.
export default oxlint(options)
