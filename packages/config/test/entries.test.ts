import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const root = fileURLToPath(new URL('../', import.meta.url))

const packageJson = JSON.parse(
  readFileSync(join(root, 'package.json'), 'utf8'),
) as Record<string, unknown> & { exports: Record<string, unknown> }

describe('package entries', () => {
  it('exports the root entry, the two factories and package.json', () => {
    expect(Object.keys(packageJson.exports).sort()).toEqual(['.', './eslint', './oxlint', './package.json'].sort())
  })

  it('points the root entry at the built index, and keeps no bare module/typings fields', () => {
    expect(packageJson.exports['.']).toEqual({
      import: { types: './dist/index.d.mts', default: './dist/index.mjs' },
    })
    expect(packageJson.module).toBeUndefined()
    expect(packageJson.types).toBeUndefined()
  })

  it('gives the root entry the option types and no runtime exports', async () => {
    // The root is where `Options` is named, not a third way to build a config: an empty runtime
    // surface is what keeps it from pulling either Adapter.
    expect(existsSync(join(root, 'dist/index.mjs'))).toBe(true)
    expect(Object.keys(await import('../dist/index.mjs'))).toEqual([])

    const declarations = readFileSync(join(root, 'dist/index.d.mts'), 'utf8')
    expect(declarations).toContain('Options')
    expect(declarations).not.toContain('function eslint')
    expect(declarations).not.toContain('function oxlint')
  })

  it('exposes thenable factories on both built subpaths', async () => {
    const { eslint } = await import('../dist/eslint.mjs') as { eslint: () => PromiseLike<{ name?: string }[]> }
    const { oxlint } = await import('../dist/oxlint.mjs') as { oxlint: () => PromiseLike<unknown> }

    const configs = await eslint()
    expect(configs.map(config => config.name)).toContain('lumirelle/javascript/rules')
    await expect(oxlint()).resolves.toBeTypeOf('object')
  })
})
