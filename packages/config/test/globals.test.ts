import type { Linter } from 'eslint'
import globals from 'globals'
import { describe, expect, it } from 'vitest'
import { eslint } from '../src/eslint'
import { oxlint } from '../src/oxlint'

/** The ESLint object with that name. */
async function eslintConfig(name: string): Promise<Linter.Config> {
  const config = (await eslint({ gitignore: false, isInEditor: false })).find(config => config.name === name)
  if (!config) {
    throw new Error(`eslint() emitted no "${name}" object`)
  }
  return config
}

/** Every `globals` table the Oxlint Emission declares, merged as Oxlint merges them. */
async function oxlintGlobals(): Promise<Record<string, string>> {
  const tables = (await oxlint({ gitignore: false, isInEditor: false })).overrides?.map(override => override.globals ?? {}) ?? []
  const merged: Record<string, string> = {}
  Object.assign(merged, ...tables)
  return merged
}

describe('globals read-only versus writable', () => {
  // `window`, `document` and `navigator` are browser globals a file may read but not assign to,
  // and `process` is Node's; the `globals` package spells all four `false`.
  const readonly = ['window', 'document', 'navigator', 'process'] as const
  // `location` is a browser global a script may assign (`location = '...'`), and `exports` is
  // Node's writable binding; the `globals` package spells both `true`.
  const writable = ['location', 'exports'] as const

  it('maps the shared globals table through, so Oxlint agrees with ESLint', async () => {
    // The tables come from the `globals` package, so the expectations are read from it rather
    // than restated: a writable global is `true` there and `writable` in the Oxlint Emission.
    const table: Record<string, boolean> = { ...globals.browser, ...globals.node }
    for (const name of writable) {
      expect(table[name], name).toBe(true)
    }
    for (const name of readonly) {
      expect(table[name], name).toBe(false)
    }
  })

  it('keeps a read-only global read-only in the Oxlint Emission', async () => {
    const emitted = await oxlintGlobals()
    for (const name of readonly) {
      expect(emitted[name], name).toBe('readonly')
    }
  })

  it('keeps a writable global writable in the Oxlint Emission', async () => {
    const emitted = await oxlintGlobals()
    for (const name of writable) {
      expect(emitted[name], name).toBe('writable')
    }
  })

  it('carries the same booleans on the ESLint side', async () => {
    const languageOptions = (await eslintConfig('lumirelle/javascript/setup')).languageOptions as {
      globals?: Record<string, boolean>
    }
    for (const name of readonly) {
      expect(languageOptions.globals?.[name], name).toBe(false)
    }
    for (const name of writable) {
      expect(languageOptions.globals?.[name], name).toBe(true)
    }
  })
})
