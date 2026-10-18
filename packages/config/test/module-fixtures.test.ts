import type { Linter } from 'eslint'
import { fileURLToPath } from 'node:url'
import { ESLint } from 'eslint'
import { afterAll, describe, expect, it } from 'vitest'
import { eslint } from '../src/eslint'
import { oxlint } from '../src/oxlint'
import { coverageReport } from '../src/oxlint/report'
import { PLUGIN_IDS, pluginDefinition } from '../src/plugins'
import { lint, project, scratchDirectory } from './helpers/oxlint-binary'

/** One diagnostic, as both engines can be compared on it: the file inside the fixture project. */
interface Reported {
  file: string
  ruleId: string
  line: number
}

/** What each Module's fixture trips under the real binaries, in the spelling of each engine. */
const EXPECTATIONS: Record<string, { eslint: Reported[], oxlint: Reported[] }> = {
  imports: {
    eslint: [
      { file: 'violations.js', ruleId: 'import/no-duplicates', line: 1 },
      { file: 'violations.js', ruleId: 'import/first', line: 5 },
      { file: 'violations.js', ruleId: 'import/no-duplicates', line: 5 },
    ],
    // Oxlint reports a duplicate import once, on the import it repeats.
    oxlint: [
      { file: 'violations.js', ruleId: 'import/no-duplicates', line: 1 },
      { file: 'violations.js', ruleId: 'import/first', line: 5 },
    ],
  },
  unicorn: {
    eslint: [
      // The `e18e` Module reports the same `indexOf` comparison as `unicorn`; both are house rules.
      { file: 'violations.js', ruleId: 'e18e/prefer-includes', line: 2 },
      { file: 'violations.js', ruleId: 'unicorn/prefer-includes', line: 2 },
      { file: 'violations.js', ruleId: 'node/no-deprecated-api', line: 6 },
      { file: 'violations.js', ruleId: 'node/prefer-global/buffer', line: 6 },
      { file: 'violations.js', ruleId: 'unicorn/no-new-buffer', line: 6 },
    ],
    // `node/no-deprecated-api` and `node/prefer-global/buffer` are in `coverage.json`.
    oxlint: [
      { file: 'violations.js', ruleId: 'e18e/prefer-includes', line: 2 },
      { file: 'violations.js', ruleId: 'unicorn/prefer-includes', line: 2 },
      { file: 'violations.js', ruleId: 'unicorn/no-new-buffer', line: 6 },
    ],
  },
  node: {
    eslint: [{ file: 'violations.js', ruleId: 'node/handle-callback-err', line: 4 }],
    oxlint: [{ file: 'violations.js', ruleId: 'node/handle-callback-err', line: 4 }],
  },
  jsdoc: {
    eslint: [{ file: 'violations.js', ruleId: 'jsdoc/empty-tags', line: 4 }],
    oxlint: [{ file: 'violations.js', ruleId: 'jsdoc/empty-tags', line: 4 }],
  },
  test: {
    eslint: [
      { file: 'violations.test.js', ruleId: 'test/consistent-test-it', line: 1 },
      { file: 'violations.test.js', ruleId: 'test/consistent-test-it', line: 3 },
      { file: 'violations.test.js', ruleId: 'test/no-only-tests', line: 3 },
    ],
    // `no-only-tests` is Oxlint's `vitest/no-focused-tests`, which the Emission records instead.
    oxlint: [{ file: 'violations.test.js', ruleId: 'vitest/consistent-test-it', line: 3 }],
  },
  disables: {
    eslint: [
      { file: 'src/app.js', ruleId: 'antfu/no-top-level-await', line: 1 },
      { file: 'src/app.js', ruleId: 'no-console', line: 3 },
    ],
    oxlint: [
      { file: 'src/app.js', ruleId: 'antfu/no-top-level-await', line: 1 },
      { file: 'src/app.js', ruleId: 'no-console', line: 3 },
    ],
  },
}

const scratch = scratchDirectory()

afterAll(() => {
  scratch.remove()
})

function fixtureDirectory(module: string): string {
  return fileURLToPath(new URL(`./fixtures/${module}/`, import.meta.url))
}

/** The real ESLint over one fixture project, with the file path made relative to it. */
async function lintWithEslint(module: string): Promise<Reported[]> {
  const directory = fixtureDirectory(module)
  const eslintApi = new ESLint({
    overrideConfigFile: true,
    overrideConfig: await eslint({ gitignore: false, isInEditor: false }),
    cwd: directory,
  })

  const results = await eslintApi.lintFiles(['.'])
  return results.flatMap(result =>
    result.messages.map((message: Linter.LintMessage) => ({
      file: result.filePath.slice(directory.length),
      ruleId: message.ruleId ?? '(fatal)',
      line: message.line ?? 0,
    })),
  ).sort(byPosition)
}

/** The real Oxlint over the same fixture project, with `fixtures/` stripped from the file path. */
async function lintWithOxlint(module: string): Promise<Reported[]> {
  const directory = project(
    scratch.directory,
    module,
    await oxlint({ gitignore: false, isInEditor: false }),
    fixtureDirectory(module),
  )

  return lint(directory).diagnostics.map(diagnostic => ({
    file: diagnostic.file.replace(/^fixtures\//u, ''),
    ruleId: diagnostic.ruleId,
    line: diagnostic.line,
  })).sort(byPosition)
}

function byPosition(left: Reported, right: Reported): number {
  return left.file.localeCompare(right.file) || left.line - right.line || left.ruleId.localeCompare(right.ruleId)
}

/** The Source rule key an Oxlint rule id stands for, so the two engines can be compared. */
function sourceKeyOf(oxlintRuleId: string): string {
  const [scope, ...rest] = oxlintRuleId.split('/')
  const rule = rest.join('/')
  if (scope === 'eslint') {
    return rule
  }
  const id = PLUGIN_IDS.find(id => pluginDefinition(id).oxlint?.builtin === scope)
  return id ? `${id}/${rule}` : oxlintRuleId
}

describe.each(Object.keys(EXPECTATIONS))('%s fixtures', (module) => {
  it('reports nothing for house-style code, in either tool', async () => {
    const clean = (reported: Reported[]): Reported[] => reported.filter(diagnostic => diagnostic.file.startsWith('clean'))

    expect(clean(await lintWithEslint(module))).toEqual([])
    expect(clean(await lintWithOxlint(module))).toEqual([])
  })

  it('reports through ESLint what the fixture breaks', async () => {
    expect(await lintWithEslint(module)).toEqual(EXPECTATIONS[module]!.eslint)
  })

  it('reports through Oxlint what it represents of the same fixture', async () => {
    expect(await lintWithOxlint(module)).toEqual(EXPECTATIONS[module]!.oxlint)
  })

  it('leaves no ESLint diagnostic unexplained: Oxlint either reports it or the report records it', async () => {
    const fromEslint = new Set((await lintWithEslint(module)).map(diagnostic => diagnostic.ruleId))
    const fromOxlint = new Set((await lintWithOxlint(module)).map(diagnostic => sourceKeyOf(diagnostic.ruleId)))
    const recorded = new Set(
      Object.values(coverageReport().modules)
        .flat()
        .flatMap(entry => entry.oxlint ? [entry.key, entry.oxlint] : [entry.key]),
    )

    const unexplained = [...fromEslint].filter(rule => !fromOxlint.has(rule) && !recorded.has(rule))
    expect(unexplained).toEqual([])
  })
})
