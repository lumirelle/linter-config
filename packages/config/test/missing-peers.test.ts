import { spawnSync } from 'node:child_process'
import { cpSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, symlinkSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import process from 'node:process'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { describe, expect, it } from 'vitest'

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

/** Runs the Emission in the workspace and returns the error the factory threw. */
function factoryError(directory: string, options: Record<string, boolean>): string {
  const entry = pathToFileURL(join(directory, 'node_modules/@lumirelle/linter-config/dist/eslint.mjs')).href
  const script = `
    const { eslint } = await import(${JSON.stringify(entry)})
    try {
      eslint({ gitignore: false, isInEditor: false, typescript: false, ...${JSON.stringify(options)} })
      console.log('NO ERROR')
    } catch (error) {
      console.log(error.message)
    }
  `
  const result = spawnSync(process.execPath, ['--input-type=module', '-e', script], { cwd: directory, encoding: 'utf8' })
  if (result.error || result.status !== 0) {
    throw new Error(`the Emission could not run in the fixture workspace: ${result.stderr}`)
  }
  return result.stdout.trim()
}

describe('a Module whose peer packages are missing', () => {
  it('names the packages to install instead of failing to resolve them', async () => {
    const { directory, remove } = workspace()
    try {
      expect(factoryError(directory, { react: true }))
        .toBe('The "react" Module needs packages this project has not installed: "@eslint-react/eslint-plugin", '
          + '"eslint-plugin-react-refresh". Install them to enable the Module.')
    }
    finally {
      remove()
    }
  })

  it('names every package of a Module that needs a parser as well as plugins', () => {
    const { directory, remove } = workspace()
    try {
      expect(factoryError(directory, { angular: true }))
        .toBe('The "angular" Module needs packages this project has not installed: '
          + '"@angular-eslint/eslint-plugin", "@angular-eslint/eslint-plugin-template", "@angular-eslint/template-parser". '
          + 'Install them to enable the Module.')
    }
    finally {
      remove()
    }
  })

  it('stays quiet for a Module whose peers are not asked for', () => {
    const { directory, remove } = workspace()
    try {
      expect(factoryError(directory, {})).toBe('NO ERROR')
    }
    finally {
      remove()
    }
  })
})
