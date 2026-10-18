import { spawnSync } from 'node:child_process'
import { cpSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, symlinkSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import process from 'node:process'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

const PACKAGE_ROOT = fileURLToPath(new URL('../', import.meta.url))

/**
 * A workspace holding this package and nothing else: the built Emission is copied in, and only the
 * runtime `dependencies` are linked, so every peer plugin the consumer would have to install is
 * genuinely absent.
 */
function workspace(): { directory: string, remove: () => void } {
  const directory = mkdtempSync(join(tmpdir(), 'lumirelle-missing-peer-'))
  const target = join(directory, 'node_modules/@lumirelle/linter-config')
  mkdirSync(target, { recursive: true })
  cpSync(join(PACKAGE_ROOT, 'dist'), join(target, 'dist'), { recursive: true })
  cpSync(join(PACKAGE_ROOT, 'package.json'), join(target, 'package.json'))

  const manifest = JSON.parse(readFileSync(join(PACKAGE_ROOT, 'package.json'), 'utf8')) as {
    dependencies: Record<string, string>
  }
  // The Plugin Bundles come with the package, so the default Emission still loads; only the
  // framework peers stay out, which is the situation a consumer without them is in.
  for (const name of [...Object.keys(manifest.dependencies), '@lumirelle/linter-plugins-eslint']) {
    const link = join(directory, 'node_modules', name)
    mkdirSync(dirname(link), { recursive: true })
    symlinkSync(realpathSync(join(PACKAGE_ROOT, 'node_modules', name)), link)
  }

  return { directory, remove: () => rmSync(directory, { force: true, recursive: true }) }
}

/** The options each case composes with; the workspace runs them all in one process. */
const CASES = {
  react: { react: true },
  angular: { angular: true },
  vueA11y: { vue: { a11y: true } },
  none: {},
} as const

type Case = keyof typeof CASES

/**
 * Composes the Emission in the workspace once per case and returns what each factory did: the
 * error message it threw, or `NO ERROR`.
 *
 * One process for every case, because booting Node and ESLint is the expensive part and the
 * composition itself reads nothing but the options.
 */
function factoryResults(directory: string): Record<Case, string> {
  const entry = pathToFileURL(join(directory, 'node_modules/@lumirelle/linter-config/dist/eslint.mjs')).href
  const script = `
    const { eslint } = await import(${JSON.stringify(entry)})
    const results = {}
    for (const [name, options] of Object.entries(${JSON.stringify(CASES)})) {
      try {
        eslint({ gitignore: false, isInEditor: false, typescript: false, ...options })
        results[name] = 'NO ERROR'
      } catch (error) {
        results[name] = error.message
      }
    }
    console.log(JSON.stringify(results))
  `
  // `NODE_PATH` would let `require.resolve` see this repository's own store, so the fixture would
  // look as if the peers were installed while the ESM `import()` that loads them cannot find them.
  const { NODE_PATH: _nodePath, ...env } = process.env
  const result = spawnSync(process.execPath, ['--input-type=module', '-e', script], { cwd: directory, encoding: 'utf8', env })
  if (result.error || result.status !== 0) {
    throw new Error(`the Emission could not run in the fixture workspace: ${result.stderr}`)
  }
  return JSON.parse(result.stdout) as Record<Case, string>
}

describe('a Module whose peer packages are missing', () => {
  let results: Record<Case, string>
  let remove: () => void

  beforeAll(() => {
    const created = workspace()
    remove = created.remove
    results = factoryResults(created.directory)
  }, 60_000)

  afterAll(() => remove())

  it('names the packages to install instead of failing to resolve them', () => {
    expect(results.react)
      .toBe('The "react" Module needs packages this project has not installed: "@eslint-react/eslint-plugin", '
        + '"eslint-plugin-react-refresh". Install them to enable the Module.')
  })

  it('names every package of a Module that needs a parser as well as plugins', () => {
    expect(results.angular)
      .toBe('The "angular" Module needs packages this project has not installed: '
        + '"@angular-eslint/eslint-plugin", "@angular-eslint/eslint-plugin-template", "@angular-eslint/template-parser". '
        + 'Install them to enable the Module.')
  })

  it('names the optional accessibility peer only when the Vue Module asks for it', () => {
    expect(results.vueA11y)
      .toBe('The "vue" Module needs a package this project has not installed: "eslint-plugin-vuejs-accessibility". '
        + 'Install it to enable the Module.')
  })

  it('stays quiet for a Module whose peers are not asked for', () => {
    expect(results.none).toBe('NO ERROR')
  })
})
