import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const packageJson = JSON.parse(
  readFileSync(fileURLToPath(new URL('../package.json', import.meta.url)), 'utf8'),
) as Record<string, unknown> & { exports: Record<string, unknown> }

describe('package entries', () => {
  it('exports only the two factories and package.json', () => {
    expect(Object.keys(packageJson.exports).sort()).toEqual(['./eslint', './oxlint', './package.json'].sort())
  })

  it('has no root entry left over from the single-entry package', () => {
    expect(packageJson.exports['.']).toBeUndefined()
    expect(packageJson.module).toBeUndefined()
    expect(packageJson.types).toBeUndefined()
  })

  it('exposes thenable factories on both built subpaths', async () => {
    const { eslint } = await import('../dist/eslint.mjs') as { eslint: () => PromiseLike<{ name?: string }[]> }
    const { oxlint } = await import('../dist/oxlint.mjs') as { oxlint: () => PromiseLike<unknown> }

    const configs = await eslint()
    expect(configs.map(config => config.name)).toContain('lumirelle/javascript/rules')
    await expect(oxlint()).resolves.toBeTypeOf('object')
  })
})
