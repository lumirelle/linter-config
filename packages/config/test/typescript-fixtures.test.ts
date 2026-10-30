import type { Linter } from 'eslint'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { ESLint } from 'eslint'
import { describe, expect, it } from 'vitest'
import { eslint } from '../src/eslint'

const FIXTURES = fileURLToPath(new URL('./fixtures/typescript/', import.meta.url))

/** The fixture project's own tsconfig; absolute, so the run does not depend on the working directory. */
const TSCONFIG_PATH = join(FIXTURES, 'tsconfig.json')

/** The house config, linting `files` with the real ESLint inside the fixture project. */
async function lint(
  files: string[],
  options: Parameters<typeof eslint>[0] = {},
): Promise<Linter.LintMessage[]> {
  const eslintApi = new ESLint({
    overrideConfigFile: true,
    overrideConfig: await eslint({ gitignore: false, isInEditor: false, ...options }),
    cwd: FIXTURES,
  })

  const results = await eslintApi.lintFiles(files)
  return results.flatMap(result => result.messages)
}

/** Rule ids with the line they were reported on, which is all a fixture assertion needs. */
function reported(messages: Linter.LintMessage[]): unknown[] {
  return messages.map(message => ({ ruleId: message.ruleId, line: message.line }))
}

describe('eslint() over the TypeScript fixtures', () => {
  it('reports nothing for house-style TypeScript', async () => {
    expect(reported(await lint(['clean.ts']))).toEqual([])
  })

  it('reports the TypeScript rules the fixture breaks', async () => {
    expect(reported(await lint(['violations.ts']))).toEqual([
      { ruleId: 'ts/consistent-type-definitions', line: 1 },
      { ruleId: 'ts/method-signature-style', line: 7 },
      { ruleId: 'ts/ban-ts-comment', line: 10 },
    ])
  })

  it('parses TypeScript, so a type annotation is not a parsing error', async () => {
    const messages = await lint(['violations.ts'])

    expect(messages.filter(message => message.fatal)).toEqual([])
  })

  it('stays quiet about a type-aware violation while no tsconfig is supplied', async () => {
    expect(reported(await lint(['type-aware.ts']))).toEqual([])
  })

  it('reports the type-aware violation once tsconfigPath is supplied', async () => {
    expect(
      reported(await lint(['type-aware.ts'], { typescript: { tsconfigPath: TSCONFIG_PATH } })),
    ).toEqual([{ ruleId: 'ts/no-floating-promises', line: 6 }])
  })

  it('stays quiet about erasable-syntax violations by default', async () => {
    expect(reported(await lint(['erasable.ts']))).toEqual([])
  })

  it('reports the erasable-syntax violations when erasableOnly is on', async () => {
    expect(reported(await lint(['erasable.ts'], { typescript: { erasableOnly: true } }))).toEqual([
      { ruleId: 'erasable-syntax-only/enums', line: 1 },
      { ruleId: 'erasable-syntax-only/parameter-properties', line: 7 },
      { ruleId: 'erasable-syntax-only/parameter-properties', line: 7 },
    ])
  })
})
