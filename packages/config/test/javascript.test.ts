import type { Linter } from 'eslint'
import { afterEach, describe, expect, it } from 'vitest'
import { eslint } from '../src/eslint'

/** The emitted object with the given name. */
async function objectNamed(name: string, options: Parameters<typeof eslint>[0] = {}): Promise<Linter.Config> {
  const config = (await eslint({ gitignore: false, ...options })).find(config => config.name === name)
  if (!config) {
    throw new Error(`eslint() emitted no "${name}" object`)
  }
  return config
}

function ruleOf(config: Linter.Config, rule: string): unknown {
  return config.rules?.[rule]
}

describe('eslint() javascript module', () => {
  it('emits the upstream setup and rules objects under stable names', async () => {
    const names = (await eslint({ gitignore: false })).map(config => config.name)

    // Later Modules append after this one; `typescript` owns the objects that follow here.
    expect(names.slice(0, 3)).toEqual(['lumirelle/ignores', 'lumirelle/javascript/setup', 'lumirelle/javascript/rules'])
  })

  it('declares the language both objects share once, on the setup object', async () => {
    const setup = await objectNamed('lumirelle/javascript/setup')

    expect(setup.languageOptions).toMatchObject({
      ecmaVersion: 'latest',
      sourceType: 'module',
      parserOptions: { ecmaFeatures: { jsx: true }, ecmaVersion: 'latest', sourceType: 'module' },
    })
    expect(setup.linterOptions).toEqual({ reportUnusedDisableDirectives: true })
    expect(setup.files).toBeUndefined()
    expect(setup.ignores).toBeUndefined()
  })

  it('puts the config object\'s globals under languageOptions.globals', async () => {
    const setup = await objectNamed('lumirelle/javascript/setup')
    const languageOptions = setup.languageOptions as Record<string, unknown>

    expect(languageOptions.globals).toMatchObject({
      document: false,
      navigator: false,
      window: false,
      console: false,
      process: false,
      globalThis: false,
    })
    // The bug this covers: globals were spread into the languageOptions root, where ESLint
    // reads them as unknown language options instead of globals.
    expect(languageOptions.document).toBeUndefined()
    expect(languageOptions.window).toBeUndefined()
  })

  it('declares both house plugins and their rules on the rules object', async () => {
    const rules = await objectNamed('lumirelle/javascript/rules')

    expect(Object.keys(rules.plugins ?? {}).sort()).toEqual(['antfu', 'unused-imports'])
    expect(ruleOf(rules, 'antfu/no-top-level-await')).toBe('error')
    expect(ruleOf(rules, 'unused-imports/no-unused-imports')).toBe('error')
    expect(ruleOf(rules, 'eqeqeq')).toEqual(['error', 'smart'])
    expect(ruleOf(rules, 'no-alert')).toBe('error')
  })

  it('carries no files or ignores, so the rules are global', async () => {
    const rules = await objectNamed('lumirelle/javascript/rules')

    expect(rules.files).toBeUndefined()
    // The one ignore is the Markdown default: Markdown's `SourceCode` lacks the JS-only methods
    // these rules call, so an unscoped rule set stays off `.md` files (as in Upstream).
    expect(rules.ignores).toEqual(['**/*.md'])
  })
})

describe('eslint() editor detection', () => {
  const RESTORE = { ...process.env }

  afterEach(() => {
    for (const key of Object.keys(process.env)) {
      if (!(key in RESTORE)) {
        delete process.env[key]
      }
    }
    Object.assign(process.env, RESTORE)
  })

  it('downgrades the autofixable rules to warnings when isInEditor is true', async () => {
    const rules = await objectNamed('lumirelle/javascript/rules', { isInEditor: true })

    expect(ruleOf(rules, 'prefer-const')).toEqual(['warn', { destructuring: 'all', ignoreReadBeforeAssign: true }])
    expect(ruleOf(rules, 'unused-imports/no-unused-imports')).toBe('warn')
  })

  it('keeps errors when isInEditor is false', async () => {
    const rules = await objectNamed('lumirelle/javascript/rules', { isInEditor: false })

    expect(ruleOf(rules, 'prefer-const')).toEqual(['error', { destructuring: 'all', ignoreReadBeforeAssign: true }])
  })

  it.each([
    ['VSCODE_PID', '1'],
    ['VSCODE_CWD', '/tmp'],
    ['JETBRAINS_IDE', '1'],
    ['VIM', '1'],
    ['NVIM', '1'],
    ['ZED_ENVIRONMENT', '1'],
  ])('detects an editor from %s', async (variable, value) => {
    delete process.env.CI
    process.env[variable] = value
    const rules = await objectNamed('lumirelle/javascript/rules')

    expect(ruleOf(rules, 'prefer-const')).toEqual(['warn', { destructuring: 'all', ignoreReadBeforeAssign: true }])
  })

  it('does not treat a Zed terminal as an editor', async () => {
    delete process.env.CI
    process.env.ZED_ENVIRONMENT = '1'
    process.env.ZED_TERM = 'true'
    const rules = await objectNamed('lumirelle/javascript/rules')

    expect(ruleOf(rules, 'prefer-const')).toEqual(['error', { destructuring: 'all', ignoreReadBeforeAssign: true }])
  })

  it('treats CI as not-an-editor, whatever the environment says', async () => {
    process.env.CI = '1'
    process.env.VSCODE_PID = '1'
    const rules = await objectNamed('lumirelle/javascript/rules')

    expect(ruleOf(rules, 'prefer-const')).toEqual(['error', { destructuring: 'all', ignoreReadBeforeAssign: true }])
  })

  it('treats a git hook or lint-staged as not-an-editor', async () => {
    delete process.env.CI
    process.env.VSCODE_PID = '1'
    process.env.GIT_PARAMS = '1'
    const rules = await objectNamed('lumirelle/javascript/rules')

    expect(ruleOf(rules, 'prefer-const')).toEqual(['error', { destructuring: 'all', ignoreReadBeforeAssign: true }])
  })

  it('treats an explicit isInEditor as final', async () => {
    process.env.VSCODE_PID = '1'
    const rules = await objectNamed('lumirelle/javascript/rules', { isInEditor: false })

    expect(ruleOf(rules, 'prefer-const')).toEqual(['error', { destructuring: 'all', ignoreReadBeforeAssign: true }])
  })
})
