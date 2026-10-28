import type { OxlintConfig } from 'oxlint'
import { spawnSync } from 'node:child_process'
import { cpSync, existsSync, mkdirSync, mkdtempSync, realpathSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { tmpdir } from 'node:os'
import { dirname, isAbsolute, join } from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'
import { toPosixPath } from './paths'

const REPO_ROOT = fileURLToPath(new URL('../../../', import.meta.url))
const OXLINT_BIN = join(dirname(createRequire(import.meta.url).resolve('oxlint/package.json')), 'bin', 'oxlint')

/**
 * Where this repository keeps the packages a consumer would install for `jsPlugins`.
 *
 * A peer's package is linked from the consumer side, so `packages/config` — the package whose
 * Modules ask the consumer for it — is one of the roots.
 */
const PLUGIN_ROOTS = [REPO_ROOT, join(REPO_ROOT, 'packages/plugins-eslint'), join(REPO_ROOT, 'packages/config')]

/** Diagnostic filenames are relative to the project, with an optional leading `./`. */
const LEADING_DOT_SLASH = /^\.?\//u

/** `eslint(eqeqeq)` / `antfu(no-top-level-await)`: a scope and the rule name inside it. */
const DIAGNOSTIC_CODE = /^([^(]+)\((.*)\)$/u

export interface Diagnostic {
  file: string
  ruleId: string
  severity: string
  line: number
  column: number
}

interface OxlintReport {
  diagnostics: Array<{
    code: string
    severity: string
    filename: string
    labels?: Array<{ span: { line: number, column: number } }>
  }>
}

/** One entry of Oxlint's `jsPlugins`. */
type JsPluginEntry = string | { name: string, specifier: string }

/** A scratch directory that the caller removes once its run is done. */
export function scratchDirectory(prefix = 'lumirelle-oxlint-'): { directory: string, remove: () => void } {
  // `tmpdir()` is a symlink on macOS (`/var` -> `/private/var`); Oxlint matches its ignore
  // patterns against the canonical path, so the scratch project uses it from the start.
  const directory = realpathSync(mkdtempSync(join(tmpdir(), prefix)))
  return { directory, remove: () => rmSync(directory, { recursive: true, force: true }) }
}

/**
 * A scratch project holding the emission as `oxlint.config.json` — the same object a consumer's
 * `oxlint.config.ts` exports by default, so writing it as JSON also proves the Emission carries no
 * functions — plus the fixture set and the packages its `jsPlugins` name.
 *
 * The fixture project's `tsconfig.json` is copied to the project root as well: a type-aware run
 * reads the project around its working directory, exactly as a consumer's `oxlint` does.
 */
export function project(
  within: string,
  name: string,
  config: OxlintConfig,
  fixtures: string,
): string {
  const directory = mkdtempSync(join(within, `${name}-`))
  writeFileSync(join(directory, 'oxlint.config.json'), JSON.stringify(config))
  for (const entry of (config.overrides ?? []).flatMap(override => override.jsPlugins ?? [])) {
    linkPlugin(directory, entry)
  }
  cpSync(fixtures, join(directory, 'fixtures'), { recursive: true })
  if (existsSync(join(fixtures, 'tsconfig.json'))) {
    cpSync(join(fixtures, 'tsconfig.json'), join(directory, 'tsconfig.json'))
  }
  return directory
}

/**
 * A bare `jsPlugins` specifier is the consumer's own install, which Oxlint resolves the way Node
 * would from the project it runs in, so the scratch project links the package there. A specifier a
 * Bundle already resolved to an absolute path needs no link: this project never installs it, and
 * the path has to exist already.
 */
function linkPlugin(directory: string, entry: JsPluginEntry): void {
  const specifier = typeof entry === 'string' ? entry : entry.specifier
  if (isAbsolute(specifier)) {
    if (!existsSync(specifier)) {
      throw new Error(`The resolved jsPlugins specifier "${specifier}" does not exist on disk.`)
    }
    return
  }
  const target = PLUGIN_ROOTS
    .map(root => resolvePackageDirectory(root, specifier))
    .find(resolved => resolved !== undefined)
  if (!target) {
    throw new Error(`Cannot find "${specifier}" to link into the Oxlint fixture project; install it in the workspace.`)
  }
  const link = join(directory, 'node_modules', specifier)
  // The same package may be declared by several Config objects, each with its own alias.
  if (existsSync(link)) {
    return
  }
  mkdirSync(dirname(link), { recursive: true })
  symlinkSync(target, link)
}

function resolvePackageDirectory(from: string, specifier: string): string | undefined {
  let entry: string
  try {
    entry = createRequire(join(from, 'package.json')).resolve(specifier)
  }
  catch {
    return undefined
  }

  let directory = dirname(entry)
  while (directory !== dirname(directory)) {
    if (existsSync(join(directory, 'package.json'))) {
      return directory
    }
    directory = dirname(directory)
  }
  return undefined
}

/**
 * Runs the real Oxlint and returns what it printed, for a run whose outcome is itself the subject
 * (a plugin that crashes the report shim exits nothing like a clean run).
 */
export function runOxlint(directory: string, patterns: string[] = ['fixtures']): { status: number | null, output: string } {
  const result = spawnSync(
    process.execPath,
    [OXLINT_BIN, '--config', join(directory, 'oxlint.config.json'), '--format', 'json', ...patterns],
    { cwd: directory, encoding: 'utf8' },
  )

  return { status: result.status, output: `${result.stdout ?? ''}${result.stderr ?? ''}` }
}

/** Runs the real Oxlint over `patterns` and returns its diagnostics, in a stable order. */
export function lint(directory: string, patterns: string[] = ['fixtures']): { diagnostics: Diagnostic[], files: number } {
  const result = spawnSync(
    process.execPath,
    [OXLINT_BIN, '--config', join(directory, 'oxlint.config.json'), '--format', 'json', ...patterns],
    { cwd: directory, encoding: 'utf8' },
  )
  // 0 is clean, 1 means "diagnostics reported"; anything else is Oxlint rejecting the config.
  if (result.status !== 0 && result.status !== 1) {
    throw new Error(`oxlint exited with ${result.status}: ${result.stderr}`)
  }

  // A run that matches no file says so on stdout before the report, so read from the first brace.
  const report = JSON.parse(result.stdout.slice(result.stdout.indexOf('{'))) as OxlintReport & { number_of_files: number }
  return {
    files: report.number_of_files,
    diagnostics: report.diagnostics
      .map((diagnostic) => {
        const label = diagnostic.labels?.[0]?.span
        return {
          file: toPosixPath(diagnostic.filename).replace(LEADING_DOT_SLASH, ''),
          ruleId: ruleIdOf(diagnostic.code),
          severity: diagnostic.severity,
          line: label?.line ?? 0,
          column: label?.column ?? 0,
        }
      })
      .sort((left, right) =>
        left.file.localeCompare(right.file)
        || left.line - right.line
        || left.column - right.column
        || left.ruleId.localeCompare(right.ruleId)),
  }
}

/** `eslint(eqeqeq)` -> `eqeqeq`, `antfu(no-top-level-await)` -> `antfu/no-top-level-await`. */
function ruleIdOf(code: string): string {
  const match = DIAGNOSTIC_CODE.exec(code)
  if (!match) {
    throw new Error(`Oxlint reported an unexpected diagnostic code "${code}".`)
  }
  const [, scope, rule] = match as unknown as [string, string, string]
  return scope === 'eslint' ? rule : `${scope}/${rule}`
}
