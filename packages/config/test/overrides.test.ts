import type { Linter } from 'eslint'
import { describe, expect, it } from 'vitest'
import { eslint } from '../src/eslint'

async function emission(options: Parameters<typeof eslint>[0] = {}): Promise<Linter.Config[]> {
  return eslint({ gitignore: false, ...options })
}

function named(configs: Linter.Config[], name: string): Linter.Config {
  const config = configs.find(config => config.name === name)
  if (!config) {
    throw new Error(`eslint() emitted no "${name}" object`)
  }
  return config
}

describe('eslint() overrides option', () => {
  it('changes one rule of a module without restating the module', async () => {
    const rules = named(
      await emission({ overrides: { javascript: { rules: { 'no-console': 'off' } } } }),
      'lumirelle/javascript/rules',
    )

    expect(rules.rules!['no-console']).toBe('off')
    // Every other rule of the module is still the house rule.
    expect(rules.rules!['no-alert']).toBe('error')
    expect(rules.rules!['antfu/no-top-level-await']).toBe('error')
    expect(Object.keys(rules.rules!)).toHaveLength(108)
  })

  it('applies a module override to every object of that module', async () => {
    const configs = await emission({ overrides: { ignores: { ignores: ['**/vendor'] } } })

    expect(named(configs, 'lumirelle/ignores').ignores).toEqual(['**/vendor'])
  })

  it('replaces files and ignores of a module when the override gives them', async () => {
    const configs = await emission({
      overrides: { javascript: { files: ['**/*.js'], ignores: ['**/*.test.js'] } },
    })

    expect(named(configs, 'lumirelle/javascript/rules').files).toEqual(['**/*.js'])
    expect(named(configs, 'lumirelle/javascript/rules').ignores).toEqual(['**/*.test.js'])
    expect(named(configs, 'lumirelle/javascript/setup').files).toEqual(['**/*.js'])
  })

  it('targets a single Config object by its lumirelle name', async () => {
    const configs = await emission({
      overrides: { 'lumirelle/javascript/rules': { files: ['**/*.js'], rules: { eqeqeq: 'off' } } },
    })

    const rules = named(configs, 'lumirelle/javascript/rules')
    expect(rules.files).toEqual(['**/*.js'])
    expect(rules.rules?.eqeqeq).toBe('off')
    expect(named(configs, 'lumirelle/javascript/setup').files).toBeUndefined()
  })

  it('throws an error naming an unknown Config object', async () => {
    expect(() => {
      void eslint({ overrides: { 'lumirelle/javascript/unknown': { rules: {} } } })
    }).toThrow(/lumirelle\/javascript\/unknown/)
  })

  it('rejects an override glob outside the shared vocabulary', async () => {
    expect(() => {
      void eslint({ overrides: { javascript: { files: ['**/*.?([cm])js'] } } })
    }).toThrow(/only \*, \*\*, \{a,b\} and character classes/)
  })
})
