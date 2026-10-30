import process from 'node:process'

/**
 * Whether the factory runs inside an editor integration.
 *
 * Editor runs downgrade the autofixable rules to warnings, so a file being edited reports
 * but is never rewritten under the cursor. `CI` and git hooks are not editors: they need
 * the strict severities so a pipeline can fail on them.
 */
export function isInEditorEnv(): boolean {
  if (process.env.CI) {
    return false
  }
  if (isInGitHooksOrLintStaged()) {
    return false
  }
  return !!(
    process.env.VSCODE_PID
    || process.env.VSCODE_CWD
    || process.env.JETBRAINS_IDE
    || process.env.VIM
    || process.env.NVIM
    || (process.env.ZED_ENVIRONMENT && !process.env.ZED_TERM)
  )
}

/** A hook runs the linter to fail the commit, not to help. */
function isInGitHooksOrLintStaged(): boolean {
  return !!(
    process.env.GIT_PARAMS
    || process.env.VSCODE_GIT_COMMAND
    || process.env.npm_lifecycle_script?.startsWith('lint-staged')
  )
}
