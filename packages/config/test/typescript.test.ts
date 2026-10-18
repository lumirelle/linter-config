import type { Linter } from 'eslint'
import process from 'node:process'
import { describe, expect, it } from 'vitest'
import { eslint } from '../src/eslint'
import { GLOB_ASTRO_TS, GLOB_MARKDOWN, GLOB_TS, GLOB_TSX } from '../src/globs'

type Options = Parameters<typeof eslint>[0]

async function emission(options: Options = {}): Promise<Linter.Config[]> {
  return eslint({ gitignore: false, isInEditor: false, ...options })
}

function named(configs: Linter.Config[], name: string): Linter.Config {
  const config = configs.find(config => config.name === name)
  if (!config) {
    throw new Error(`eslint() emitted no "${name}" object`)
  }
  return config
}

/** The house TypeScript parser options, as a plain object a test can read. */
function parserOptions(config: Linter.Config): Record<string, unknown> {
  return (config.languageOptions?.parserOptions ?? {}) as Record<string, unknown>
}

const TSCONFIG = { typescript: { tsconfigPath: 'tsconfig.json' } }

describe('eslint() typescript module', () => {
  it('emits the upstream setup, parser and rules objects under stable names', async () => {
    const names = (await emission()).map(config => config.name)

    // The whole order, because it is the override order both Emissions keep: the base Modules,
    // then this one, then the Modules Upstream adds after it.
    expect(names).toEqual([
      'lumirelle/ignores',
      'lumirelle/javascript/setup',
      'lumirelle/javascript/rules',
      'lumirelle/typescript/setup',
      'lumirelle/typescript/parser',
      'lumirelle/typescript/rules',
      'lumirelle/node/setup',
      'lumirelle/node/rules',
      'lumirelle/jsdoc/setup',
      'lumirelle/jsdoc/rules',
      'lumirelle/imports/rules',
      'lumirelle/unicorn/setup',
      'lumirelle/unicorn/rules',
      'lumirelle/jsonc/setup',
      'lumirelle/jsonc/rules',
      'lumirelle/sort/package-json',
      'lumirelle/sort/tsconfig-json',
      'lumirelle/yaml/setup',
      'lumirelle/yaml/rules',
      'lumirelle/toml/setup',
      'lumirelle/toml/rules',
      'lumirelle/test/setup',
      'lumirelle/test/rules',
      'lumirelle/disables/scripts',
      'lumirelle/disables/cli',
      'lumirelle/disables/bin',
      'lumirelle/disables/dts',
      'lumirelle/disables/cjs',
      'lumirelle/disables/config-files',
    ])
  })

  it('declares the ts plugin on the setup object, without globs', async () => {
    const setup = named(await emission(), 'lumirelle/typescript/setup')

    expect(Object.keys(setup.plugins ?? {}).sort()).toEqual(['antfu', 'ts'])
    expect(setup.plugins?.ts?.rules?.['no-explicit-any']).toBeDefined()
    expect(setup.files).toBeUndefined()
    expect(setup.ignores).toBeUndefined()
  })

  it('scopes the parser and the rules to TypeScript files, as upstream does', async () => {
    const configs = await emission()

    for (const name of ['lumirelle/typescript/parser', 'lumirelle/typescript/rules']) {
      expect(named(configs, name).files).toEqual([GLOB_TS, GLOB_TSX])
    }
  })

  it('wires the parser from the Plugin id instead of importing it in Source', async () => {
    const parser = named(await emission(), 'lumirelle/typescript/parser').languageOptions?.parser

    // The Bundle resolves `ts` to `@typescript-eslint/parser`; the parser reports its own name.
    expect(parser).toMatchObject({ meta: { name: 'typescript-eslint/parser' } })
    expect(typeof (parser as { parseForESLint?: unknown }).parseForESLint).toBe('function')
  })

  it('gives the parser the module source type and no type information by default', async () => {
    const options = parserOptions(named(await emission(), 'lumirelle/typescript/parser'))

    expect(options).toEqual({ extraFileExtensions: [], sourceType: 'module' })
  })

  it('carries the two presets as data, so the emitted rules are stable without a plugin object', async () => {
    const rules = named(await emission(), 'lumirelle/typescript/rules').rules ?? {}

    // From `strict`: an error. From `eslint-recommended`: core rules the TS parser covers.
    expect(rules['ts/no-namespace']).toBe('error')
    expect(rules['no-undef']).toBe('off')
    // The house overrides of the presets.
    expect(rules['ts/no-explicit-any']).toBe('off')
    expect(rules['ts/consistent-type-definitions']).toEqual(['error', 'interface'])
    expect(rules['ts/method-signature-style']).toEqual(['error', 'property'])
    expect(Object.keys(rules)).toHaveLength(63)
  })

  it('leaves the type-aware rules out until a tsconfig is supplied', async () => {
    const configs = await emission()
    const names = configs.map(config => config.name)

    expect(names).not.toContain('lumirelle/typescript/rules-type-aware')
    expect(names).not.toContain('lumirelle/typescript/type-aware-parser')
    expect(configs.some(config => 'ts/no-floating-promises' in (config.rules ?? {}))).toBe(false)
  })

  it('adds the type-aware parser and rules objects when tsconfigPath is supplied', async () => {
    const configs = await emission(TSCONFIG)
    const names = configs.map(config => config.name)

    // The type-aware pair slots in after the parser and after the rules, as Upstream builds it.
    expect(names.slice(0, 8)).toEqual([
      'lumirelle/ignores',
      'lumirelle/javascript/setup',
      'lumirelle/javascript/rules',
      'lumirelle/typescript/setup',
      'lumirelle/typescript/parser',
      'lumirelle/typescript/type-aware-parser',
      'lumirelle/typescript/rules',
      'lumirelle/typescript/rules-type-aware',
    ])
    expect(named(configs, 'lumirelle/typescript/rules-type-aware').rules?.['ts/no-floating-promises']).toBe('error')
    expect(Object.keys(named(configs, 'lumirelle/typescript/rules-type-aware').rules ?? {})).toHaveLength(21)
  })

  it('points the type-aware parser at the tsconfig from the working directory', async () => {
    const config = named(await emission(TSCONFIG), 'lumirelle/typescript/type-aware-parser')

    expect(parserOptions(config)).toEqual({
      extraFileExtensions: [],
      sourceType: 'module',
      projectService: { allowDefaultProject: ['./*.js'], defaultProject: 'tsconfig.json' },
      tsconfigRootDir: process.cwd(),
    })
    expect(config.ignores).toEqual([`${GLOB_MARKDOWN}/**`, GLOB_ASTRO_TS])
  })

  it('requires an argument list for every function when the project is a library', async () => {
    const rules = named(await emission({ type: 'lib' }), 'lumirelle/typescript/rules').rules ?? {}

    expect(rules['ts/explicit-function-return-type']).toEqual(['error', {
      allowExpressions: true,
      allowHigherOrderFunctions: true,
      allowIIFEs: true,
    }])
  })

  it('widens the scope and the parser extensions through componentExts', async () => {
    const configs = await emission({ componentExts: ['vue'] })

    expect(named(configs, 'lumirelle/typescript/rules').files).toEqual([GLOB_TS, GLOB_TSX, '**/*.vue'])
    expect(parserOptions(named(configs, 'lumirelle/typescript/parser')).extraFileExtensions).toEqual(['.vue'])
  })

  it('is off when the caller turns typescript off', async () => {
    const names = (await emission({ typescript: false })).map(config => config.name ?? '')

    expect(names.some(name => name.startsWith('lumirelle/typescript/'))).toBe(false)
  })
})

describe('eslint() typescript erasableOnly', () => {
  it('adds no erasable object by default', async () => {
    const names = (await emission(TSCONFIG)).map(config => config.name)

    expect(names).not.toContain('lumirelle/typescript/erasable-syntax-only')
  })

  it('adds the peer erasable-syntax-only plugin and its five rules when asked', async () => {
    const config = named(
      await emission({ typescript: { erasableOnly: true } }),
      'lumirelle/typescript/erasable-syntax-only',
    )

    expect(Object.keys(config.plugins ?? {})).toEqual(['erasable-syntax-only'])
    expect(config.plugins?.['erasable-syntax-only']).toBeDefined()
    expect(config.rules).toEqual({
      'erasable-syntax-only/enums': 'error',
      'erasable-syntax-only/export-aliases': 'error',
      'erasable-syntax-only/import-aliases': 'error',
      'erasable-syntax-only/namespaces': 'error',
      'erasable-syntax-only/parameter-properties': 'error',
    })
  })
})
