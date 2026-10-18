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

  it('resolves to a flat config whose objects all carry a lumirelle name', async () => {
    const configs = await eslint({ gitignore: false })

    expect(Array.isArray(configs)).toBe(true)
    expect(configs.length).toBeGreaterThan(0)
    for (const config of configs) {
      expect(config.name).toMatch(/^lumirelle\/\S+/)
    }
  })

  it('keeps the names unique, so override and remove stay addressable', async () => {
    const names = (await eslint({ gitignore: false })).map(config => config.name)

    expect(new Set(names).size).toBe(names.length)
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

  it('resolves to a valid Oxlint config', async () => {
    const config = await oxlint()

    expect(Array.isArray(config)).toBe(false)
    expect(Object.keys(config).filter(key => !OXLINT_ROOT_FIELDS.includes(key))).toEqual([])
  })

  it('carries the js-domain module into this Emission too', async () => {
    const config = await oxlint({ gitignore: false })
    const overrides = config.overrides ?? []
    const rules = overrides.flatMap(override => Object.keys(override.rules ?? {}))

    expect(rules).toContain('antfu/no-top-level-await')
    expect(rules).toContain('eqeqeq')
  })

  it('accepts the options the ESLint factory takes', async () => {
    await expect(oxlint({ type: 'lib', gitignore: false })).resolves.toBeTypeOf('object')
  })
})
