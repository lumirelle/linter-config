// @ts-check
import { eslint } from '@lumirelle/linter-config/eslint'
import { options } from './options.ts'

// One options object for the whole workspace, at the workspace root: every package under
// `packages/` is linted from this file, and a package's deviation is an `overrides` entry in
// `options.ts`, not a second config.
export default eslint(options)
