import type { Linter } from 'eslint'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterAll, describe, expect, it } from 'vitest'
import { eslint } from '../src/eslint'
import { assertGlobVocabulary, GLOB_EXCLUDE } from '../src/globs'

const scratch = mkdtempSync(join(tmpdir(), 'lumirelle-ignores-'))

afterAll(() => {
  rmSync(scratch, { recursive: true, force: true })
})

/** A directory holding the given `.gitignore` content, used as the gitignore `cwd`. */
function gitignoreDirectory(name: string, content?: string): string {
  const directory = join(scratch, name)
  mkdirSync(directory)
  if (content !== undefined) {
    writeFileSync(join(directory, '.gitignore'), content)
  }
  return directory
}

async function ignoresOf(options: Parameters<typeof eslint>[0]): Promise<Linter.Config[]> {
  return (await eslint({ gitignore: false, ...options })).filter(config => config.name === 'lumirelle/ignores')
}

describe('eslint() global ignores', () => {
  it('emits one global ignores object named lumirelle/ignores', async () => {
    const configs = await ignoresOf({})

    expect(configs).toHaveLength(1)
    expect(configs[0]!.files).toBeUndefined()
    expect(configs[0]!.ignores).toEqual(expect.arrayContaining(GLOB_EXCLUDE))
  })

  it('appends the caller\'s ignores after the house list', async () => {
    const [config] = await ignoresOf({ ignores: ['**/vendor', '**/fixtures'] })

    expect(config!.ignores!.slice(-2)).toEqual(['**/vendor', '**/fixtures'])
    expect(config!.ignores!.slice(0, GLOB_EXCLUDE.length)).toEqual(GLOB_EXCLUDE)
  })

  it('emits only globs the shared vocabulary accepts', async () => {
    const [config] = await ignoresOf({ ignores: ['**/vendor'] })

    expect(() => assertGlobVocabulary(config!.ignores!)).not.toThrow()
  })
})

describe('eslint() gitignore handling', () => {
  it('folds the project\'s .gitignore patterns into lumirelle/ignores by default', async () => {
    const cwd = gitignoreDirectory('enabled', 'generated/\n*.snap\n')
    const [config] = await ignoresOf({ gitignore: { cwd } })

    expect(config!.ignores).toEqual(expect.arrayContaining(['**/generated/', '**/*.snap']))
  })

  it('reads the repository\'s .gitignore when it gets no options', async () => {
    const [config] = await ignoresOf({ gitignore: undefined })

    // `**/*.tsbuildinfo` is in this repository's `.gitignore`, not in GLOB_EXCLUDE.
    expect(config!.ignores).toEqual(expect.arrayContaining(['**/*.tsbuildinfo']))
  })

  it('is a no-op when the project has no .gitignore', async () => {
    const cwd = gitignoreDirectory('missing')
    const [config] = await ignoresOf({ gitignore: { cwd } })

    expect(config!.ignores).toEqual(GLOB_EXCLUDE)
  })

  it('is disabled by gitignore: false', async () => {
    const cwd = gitignoreDirectory('disabled', 'generated/\n')
    const [config] = await ignoresOf({ gitignore: { cwd } })

    expect(config!.ignores).not.toEqual(GLOB_EXCLUDE)
    expect((await ignoresOf({ gitignore: false }))[0]!.ignores).not.toEqual(config!.ignores)
  })

  it('keeps the patterns a negation would make unrepresentable out of the shared list', async () => {
    const cwd = gitignoreDirectory('negation', 'dist\ndist/keep.js\n!dist/keep.js\n')
    const [config] = await ignoresOf({ gitignore: { cwd } })

    expect(config!.ignores).toEqual(expect.arrayContaining(['**/dist', 'dist/keep.js']))
    expect(config!.ignores!.some(pattern => pattern.startsWith('!'))).toBe(false)
    expect(() => assertGlobVocabulary(config!.ignores!)).not.toThrow()
  })
})
