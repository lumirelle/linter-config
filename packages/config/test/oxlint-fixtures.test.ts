import type { Linter } from 'eslint'
import type { OxlintConfig } from 'oxlint'
import type { Diagnostic } from './helpers/oxlint-binary'
import { cpSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { ESLint } from 'eslint'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { eslint } from '../src/eslint'
import { oxlint } from '../src/oxlint'
import { lint, project, scratchDirectory } from './helpers/oxlint-binary'

const FIXTURES = fileURLToPath(new URL('./fixtures/javascript/', import.meta.url))
/** A TypeScript fixture project: the same files plus the `tsconfig.json` a type-aware run reads. */
const TS_FIXTURES = fileURLToPath(new URL('./fixtures/typescript/', import.meta.url))

const scratch = scratchDirectory()

/** The whole fixture set linted once under the house Emission, so the assertions below share one run. */
let houseRun: { diagnostics: Diagnostic[], files: number } = { diagnostics: [], files: 0 }

beforeAll(async () => {
  houseRun = lint(project(scratch.directory, 'house', await house(), FIXTURES))
})

afterAll(() => {
  scratch.remove()
})

/** The house emission, which is what a consumer writes into `oxlint.config.ts`. */
async function house(options: Parameters<typeof oxlint>[0] = {}): Promise<OxlintConfig> {
  return oxlint({ gitignore: false, isInEditor: false, ...options })
}

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
    const directory = project(scratch.directory, 'type-aware', await house({ oxlint: { typeAware: true, typeCheck: true } }), FIXTURES)
    const { diagnostics, files } = lint(directory)

    expect(files).toBe(4)
    expect(diagnostics.some(diagnostic => diagnostic.ruleId === 'eqeqeq')).toBe(true)
  })
})

describe('oxlint() ignores through the real Oxlint', () => {
  it('skips a directory the caller added to the global ignores', async () => {
    const ignored = project(scratch.directory, 'ignored', await house({ ignores: ['**/vendor'] }), FIXTURES)
    cpSync(FIXTURES, join(ignored, 'vendor'), { recursive: true })

    expect(lint(ignored, ['vendor'])).toEqual({ diagnostics: [], files: 0 })
  })

  it('reports the same files once the caller stops ignoring them', async () => {
    const unlinted = project(scratch.directory, 'not-ignored', await house(), FIXTURES)
    cpSync(FIXTURES, join(unlinted, 'vendor'), { recursive: true })

    expect(lint(unlinted, ['vendor']).files).toBe(4)
  })
})

describe('oxlint() over the TypeScript fixtures', () => {
  it('reports the TypeScript rules the fixture breaks, through the built-in typescript scope', async () => {
    const directory = project(scratch.directory, 'ts-house', await house(), TS_FIXTURES)

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
      scratch.directory,
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
    const directory = project(scratch.directory, 'ts-erasable', await house({ typescript: { erasableOnly: true } }), TS_FIXTURES)

    const erasable = lint(directory).diagnostics.filter(diagnostic => diagnostic.ruleId.startsWith('erasable-syntax-only/'))

    expect(erasable).toEqual([])
  })
})
