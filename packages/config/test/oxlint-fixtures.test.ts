import type { Linter } from 'eslint'
import type { OxlintConfig } from 'oxlint'
import { spawnSync } from 'node:child_process'
import { cpSync, existsSync, mkdirSync, mkdtempSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { ESLint } from 'eslint'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { eslint } from '../src/eslint'
import { oxlint } from '../src/oxlint'

const FIXTURES = fileURLToPath(new URL('./fixtures/javascript/', import.meta.url))
/** A TypeScript fixture project: the same files plus the `tsconfig.json` a type-aware run reads. */
const TS_FIXTURES = fileURLToPath(new URL('./fixtures/typescript/', import.meta.url))
const REPO_ROOT = fileURLToPath(new URL('../../../', import.meta.url))
const OXLINT_BIN = join(dirname(createRequire(import.meta.url).resolve('oxlint/package.json')), 'bin', 'oxlint')

/** Where this repository keeps the packages a consumer would install for `jsPlugins`. */
const PLUGIN_ROOTS = [REPO_ROOT, join(REPO_ROOT, 'packages/plugins-eslint')]

const scratch = mkdtempSync(join(tmpdir(), 'lumirelle-oxlint-'))

afterAll(() => {
  rmSync(scratch, { recursive: true, force: true })
})

interface Diagnostic {
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

/**
 * A scratch project holding the emission as `oxlint.config.json` — the same object a consumer's
 * `oxlint.config.ts` exports by default, so writing it as JSON also proves the Emission carries no
 * functions — plus the fixture set and the packages its `jsPlugins` name.
 *
 * The fixture project's `tsconfig.json` is copied to the project root as well: a type-aware run
 * reads the project around its working directory, exactly as a consumer's `oxlint` does.
 */
function project(name: string, config: OxlintConfig, fixtures: string = FIXTURES): string {
  const directory = mkdtempSync(join(scratch, `${name}-`))
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
function lint(directory: string, patterns: string[] = ['fixtures']): { diagnostics: Diagnostic[], files: number } {
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

/** The house emission, which is what a consumer writes into `oxlint.config.ts`. */
async function house(options: Parameters<typeof oxlint>[0] = {}): Promise<OxlintConfig> {
  return oxlint({ gitignore: false, isInEditor: false, ...options })
}

/** The whole fixture set linted once under the house Emission, so the assertions below share one run. */
let houseRun: { diagnostics: Diagnostic[], files: number } = { diagnostics: [], files: 0 }

beforeAll(async () => {
  houseRun = lint(project('house', await house()))
})

describe('oxlint() over the JavaScript fixtures', () => {
  it('lints every fixture and reports nothing for house-style code', () => {
    expect(houseRun.files).toBe(4)
    expect(houseRun.diagnostics.filter(diagnostic => diagnostic.file === 'fixtures/clean.js')).toEqual([])
  })

  it('reports the violations of the house rules the fixture breaks', () => {
    expect(houseRun.diagnostics.filter(diagnostic => diagnostic.file === 'fixtures/violations.js')).toEqual([
      { file: 'fixtures/violations.js', ruleId: 'no-unused-vars', severity: 'error', line: 1, column: 10 },
      { file: 'fixtures/violations.js', ruleId: 'unused-imports/no-unused-imports', severity: 'error', line: 1, column: 10 },
      { file: 'fixtures/violations.js', ruleId: 'eqeqeq', severity: 'error', line: 4, column: 12 },
      { file: 'fixtures/violations.js', ruleId: 'no-alert', severity: 'error', line: 5, column: 5 },
      { file: 'fixtures/violations.js', ruleId: 'no-console', severity: 'error', line: 7, column: 3 },
    ])
  })

  it('reports top-level await through the declared jsPlugin', () => {
    expect(houseRun.diagnostics.filter(diagnostic => diagnostic.file === 'fixtures/top-level-await.js')).toEqual([
      { file: 'fixtures/top-level-await.js', ruleId: 'antfu/no-top-level-await', severity: 'error', line: 1, column: 16 },
    ])
  })

  it('is clean where ESLint reports a rule the Emission had to drop', async () => {
    const eslintApi = new ESLint({
      overrideConfigFile: true,
      overrideConfig: await eslint({ gitignore: false, isInEditor: false }),
      cwd: FIXTURES,
    })
    const [result] = await eslintApi.lintFiles(['dot-notation.js'])
    const ruleIds = (result?.messages ?? []).map((message: Linter.LintMessage) => message.ruleId)

    // `dot-notation` is in `coverage.json`: Oxlint only has a type-aware realization of it.
    expect(ruleIds).toEqual(['dot-notation'])
    expect(houseRun.diagnostics.filter(diagnostic => diagnostic.file === 'fixtures/dot-notation.js')).toEqual([])
  })

  it('accepts the type-aware root options and still reports', async () => {
    const directory = project('type-aware', await house({ oxlint: { typeAware: true, typeCheck: true } }))
    const { diagnostics, files } = lint(directory)

    expect(files).toBe(4)
    expect(diagnostics.some(diagnostic => diagnostic.ruleId === 'eqeqeq')).toBe(true)
  })
})

describe('oxlint() ignores through the real Oxlint', () => {
  it('skips a directory the caller added to the global ignores', async () => {
    const ignored = project('ignored', await house({ ignores: ['**/vendor'] }))
    cpSync(FIXTURES, join(ignored, 'vendor'), { recursive: true })

    expect(lint(ignored, ['vendor'])).toEqual({ diagnostics: [], files: 0 })
  })

  it('reports the same files once the caller stops ignoring them', async () => {
    const unlinted = project('not-ignored', await house())
    cpSync(FIXTURES, join(unlinted, 'vendor'), { recursive: true })

    expect(lint(unlinted, ['vendor']).files).toBe(4)
  })
})

describe('oxlint() over the TypeScript fixtures', () => {
  it('reports the TypeScript rules the fixture breaks, through the built-in typescript scope', async () => {
    const directory = project('ts-house', await house(), TS_FIXTURES)

    expect(lint(directory)).toEqual({
      files: 4,
      diagnostics: [
        { file: 'fixtures/violations.ts', ruleId: 'typescript/consistent-type-definitions', severity: 'error', line: 1, column: 8 },
        { file: 'fixtures/violations.ts', ruleId: 'typescript/method-signature-style', severity: 'error', line: 7, column: 3 },
        { file: 'fixtures/violations.ts', ruleId: 'typescript/ban-ts-comment', severity: 'error', line: 10, column: 3 },
      ],
    })
  })

  it('reports the type-aware violation once both sides turn type awareness on', async () => {
    const directory = project(
      'ts-type-aware',
      await house({ typescript: { tsconfigPath: 'tsconfig.json' }, oxlint: { typeAware: true, typeCheck: true } }),
      TS_FIXTURES,
    )

    const typeAware = lint(directory).diagnostics.filter(diagnostic => diagnostic.ruleId === 'typescript/no-floating-promises')

    expect(typeAware).toEqual([
      { file: 'fixtures/type-aware.ts', ruleId: 'typescript/no-floating-promises', severity: 'error', line: 6, column: 3 },
    ])
  })

  it('leaves the erasable-syntax-only rules to ESLint', async () => {
    const directory = project('ts-erasable', await house({ typescript: { erasableOnly: true } }), TS_FIXTURES)

    const erasable = lint(directory).diagnostics.filter(diagnostic => diagnostic.ruleId.startsWith('erasable-syntax-only/'))

    expect(erasable).toEqual([])
  })
})
