import type { Linter } from 'eslint'
import { fileURLToPath } from 'node:url'
import { ESLint } from 'eslint'
import { afterAll, describe, expect, it } from 'vitest'
import { eslint } from '../src/eslint'
import { oxlint } from '../src/oxlint'
import { lint, project, scratchDirectory } from './helpers/oxlint-binary'
import { toPosixPath } from './helpers/paths'

/** One diagnostic, reduced to what both engines can be compared on. */
interface Reported {
  file: string
  ruleId: string
  line: number
}

const FIXTURES = fileURLToPath(new URL('./fixtures/stylistic/', import.meta.url))
const scratch = scratchDirectory()

afterAll(() => {
  scratch.remove()
})

/** The real ESLint over the fixture, with the file path made relative to it. */
async function lintWithEslint(options: Parameters<typeof eslint>[0] = {}): Promise<Reported[]> {
  const eslintApi = new ESLint({
    overrideConfigFile: true,
    overrideConfig: await eslint({ gitignore: false, isInEditor: false, ...options }),
    cwd: FIXTURES,
  })

  const results = await eslintApi.lintFiles(['.'])
  return results
    .flatMap(result =>
      result.messages.map((message: Linter.LintMessage) => ({
        file: toPosixPath(result.filePath.slice(FIXTURES.length)),
        ruleId: message.ruleId ?? '(fatal)',
        line: message.line ?? 0,
      })),
    )
    .sort(byPosition)
}

/** The real Oxlint over the same fixture, with `fixtures/` stripped from the file path. */
async function lintWithOxlint(options: Parameters<typeof oxlint>[0] = {}): Promise<Reported[]> {
  const directory = project(
    scratch.directory,
    `stylistic-${options.stylistic ? 'on' : 'off'}`,
    await oxlint({ gitignore: false, isInEditor: false, ...options }),
    FIXTURES,
  )

  return lint(directory)
    .diagnostics.map(diagnostic => ({
      file: diagnostic.file.replace(/^fixtures\//u, ''),
      ruleId: diagnostic.ruleId,
      line: diagnostic.line,
    }))
    .sort(byPosition)
}

function byPosition(left: Reported, right: Reported): number {
  return (
    left.file.localeCompare(right.file)
    || left.line - right.line
    || left.ruleId.localeCompare(right.ruleId)
  )
}

describe('the stylistic Module over the real binaries', () => {
  it('reports nothing through ESLint while the house default leaves it off', async () => {
    // Nothing at all: the fixture only breaks formatting.
    expect(await lintWithEslint({})).toEqual([])
  })

  it('reports nothing through Oxlint while the house default leaves it off', async () => {
    expect(await lintWithOxlint({})).toEqual([])
  })

  it('reports the formatting the fixture breaks through ESLint once it is on', async () => {
    expect(await lintWithEslint({ stylistic: true })).toEqual([
      { file: 'violations.js', ruleId: 'style/quotes', line: 1 },
      { file: 'violations.js', ruleId: 'style/semi', line: 1 },
      { file: 'violations.js', ruleId: 'style/semi', line: 4 },
    ])
  })

  it('reports it through Oxlint too, through the declared jsPlugin', async () => {
    expect(await lintWithOxlint({ stylistic: true })).toEqual([
      { file: 'violations.js', ruleId: 'style/quotes', line: 1 },
      { file: 'violations.js', ruleId: 'style/semi', line: 1 },
      { file: 'violations.js', ruleId: 'style/semi', line: 4 },
    ])
  })
})
