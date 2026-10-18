import type { OxlintConfig } from 'oxlint'
import { spawnSync } from 'node:child_process'
import { cpSync, existsSync, mkdirSync, mkdtempSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'

const REPO_ROOT = fileURLToPath(new URL('../../../', import.meta.url))
const OXLINT_BIN = join(dirname(createRequire(import.meta.url).resolve('oxlint/package.json')), 'bin', 'oxlint')

/** Where this repository keeps the packages a consumer would install for `jsPlugins`. */
const PLUGIN_ROOTS = [REPO_ROOT, join(REPO_ROOT, 'packages/plugins-eslint')]

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
  const directory = mkdtempSync(join(tmpdir(), prefix))
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
 * Oxlint resolves a `jsPlugins` specifier from the config file's directory, so the scratch project
 * needs the packages a consumer would have installed.
 */
function linkPlugin(directory: string, entry: JsPluginEntry): void {
  const specifier = typeof entry === 'string' ? entry : entry.specifier
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
          file: diagnostic.filename.replace(/^\.?\//u, ''),
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
  const match = /^([^(]+)\((.*)\)$/u.exec(code)
  if (!match) {
    throw new Error(`Oxlint reported an unexpected diagnostic code "${code}".`)
  }
  const [, scope, rule] = match as unknown as [string, string, string]
  return scope === 'eslint' ? rule : `${scope}/${rule}`
}
