import type { Linter } from 'eslint'
import { fileURLToPath } from 'node:url'
import { ESLint } from 'eslint'
import { describe, expect, it } from 'vitest'
import { eslint } from '../src/eslint'

const FIXTURES = fileURLToPath(new URL('./fixtures/javascript/', import.meta.url))

/** The house config, linting the fixtures with the real ESLint. */
async function lintFixtures(): Promise<Map<string, Linter.LintMessage[]>> {
  const eslintApi = new ESLint({
    overrideConfigFile: true,
    overrideConfig: await eslint({ gitignore: false, isInEditor: false }),
    cwd: FIXTURES,
  })

  const results = await eslintApi.lintFiles(['.'])
  return new Map(results.map(result => [result.filePath.replace(FIXTURES, ''), result.messages]))
}

function diagnostics(messages: Linter.LintMessage[]): unknown[] {
  return messages.map(message => ({
    ruleId: message.ruleId,
    severity: message.severity,
    line: message.line,
    column: message.column,
    message: message.message,
  }))
}

describe('eslint() over the JavaScript fixtures', () => {
  it('reports nothing for house-style code', async () => {
    const messages = (await lintFixtures()).get('clean.js')

    expect(diagnostics(messages!)).toEqual([])
  })

  it('reports the violations of every house rule the fixture breaks', async () => {
    const messages = (await lintFixtures()).get('violations.js')

    expect(diagnostics(messages!)).toEqual([
      {
        ruleId: 'no-unused-vars',
        severity: 2,
        line: 1,
        column: 10,
        message: '\'readFileSync\' is defined but never used.',
      },
      {
        ruleId: 'unused-imports/no-unused-imports',
        severity: 2,
        line: 1,
        column: 10,
        message: '\'readFileSync\' is defined but never used.',
      },
      {
        ruleId: 'eqeqeq',
        severity: 2,
        line: 4,
        column: 12,
        message: 'Expected \'===\' and instead saw \'==\'.',
      },
      {
        ruleId: 'no-alert',
        severity: 2,
        line: 5,
        column: 5,
        message: 'Unexpected alert.',
      },
      {
        ruleId: 'no-console',
        severity: 2,
        line: 7,
        column: 3,
        message: 'Unexpected console statement. Only these console methods are allowed: warn, error.',
      },
    ])
  })

  it('reports top-level await through the antfu plugin', async () => {
    const messages = (await lintFixtures()).get('top-level-await.js')

    expect(diagnostics(messages!)).toEqual([
      {
        ruleId: 'antfu/no-top-level-await',
        severity: 2,
        line: 1,
        column: 16,
        message: 'Do not use top-level await',
      },
    ])
  })

  it('takes the globals from the setup object, so browser and node names are known', async () => {
    const messages = (await lintFixtures()).get('violations.js')

    expect(messages!.some(message => message.ruleId === 'no-undef')).toBe(false)
  })
})
