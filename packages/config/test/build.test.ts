import { existsSync, readFileSync } from 'node:fs'
import { basename, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const dist = fileURLToPath(new URL('../dist/', import.meta.url))
const ENTRIES = ['eslint.mjs', 'oxlint.mjs']

/** The relative modules a built entry imports. */
function relativeImports(file: string): string[] {
  const source = readFileSync(join(dist, file), 'utf8')
  return [...source.matchAll(/from\s*["'](\.[^"']+)["']/g)].map(match => resolve(dist, match[1]!))
}

describe('build output', () => {
  it('emits both entries', () => {
    for (const entry of ENTRIES) {
      expect(existsSync(join(dist, entry))).toBe(true)
    }
  })

  it('emits declarations for both entries', () => {
    for (const entry of ENTRIES) {
      expect(existsSync(join(dist, entry.replace('.mjs', '.d.mts')))).toBe(true)
    }
  })

  it('shares one Source chunk between the entries instead of duplicating it', () => {
    const [first, second] = ENTRIES.map(entry => relativeImports(entry))
    const shared = first!.filter(file => second!.includes(file))
    const chunks = shared.filter(file => !ENTRIES.includes(basename(file)))

    expect(chunks.length).toBeGreaterThan(0)

    // Source-side data lives in the shared chunk only; neither entry inlines its own copy.
    const registryMarker = '@typescript-eslint/eslint-plugin'
    for (const chunk of chunks) {
      expect(readFileSync(chunk, 'utf8')).toContain(registryMarker)
    }
    for (const entry of ENTRIES) {
      expect(readFileSync(join(dist, entry), 'utf8')).not.toContain(registryMarker)
    }
  })
})
