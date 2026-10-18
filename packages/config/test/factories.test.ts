import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { eslint } from '../src/eslint'
import { oxlint } from '../src/oxlint'

const oxlintSchema = JSON.parse(
  readFileSync(join(dirname(createRequire(import.meta.url).resolve('oxlint/package.json')), 'configuration_schema.json'), 'utf8'),
) as { properties: Record<string, unknown> }
const OXLINT_ROOT_FIELDS = Object.keys(oxlintSchema.properties)

describe('eslint()', () => {
  it('returns a thenable composer', async () => {
    const composer = eslint()

    expect(typeof composer.then).toBe('function')
    expect(typeof composer.append).toBe('function')
    expect(typeof composer.override).toBe('function')
    expect(typeof composer.remove).toBe('function')
  })

  it('resolves to an empty flat config', async () => {
    await expect(eslint()).resolves.toEqual([])
  })

  it('accepts options without changing the empty emission yet', async () => {
    await expect(eslint({ type: 'lib' })).resolves.toEqual([])
  })
})

describe('oxlint()', () => {
  it('returns a thenable composer', async () => {
    const composer = oxlint()

    expect(typeof composer.then).toBe('function')
    expect(typeof composer.append).toBe('function')
    expect(typeof composer.override).toBe('function')
    expect(typeof composer.remove).toBe('function')
  })

  it('resolves to a valid Oxlint config that configures no rules', async () => {
    const config = await oxlint()

    expect(Array.isArray(config)).toBe(false)
    expect(Object.keys(config).filter(key => !OXLINT_ROOT_FIELDS.includes(key))).toEqual([])
    expect(config.rules).toBeUndefined()
    expect(config.overrides).toBeUndefined()
    expect(config.ignorePatterns).toBeUndefined()
  })

  it('accepts options without changing the empty emission yet', async () => {
    await expect(oxlint({ type: 'lib' })).resolves.toEqual(await oxlint())
  })
})
