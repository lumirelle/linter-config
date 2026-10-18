import type { Linter } from 'eslint'
import { describe, expect, it } from 'vitest'
import { eslint } from '../src/eslint'
import { oxlint } from '../src/oxlint'

/**
 * A stable form of the Emission: keys sorted at every depth, plugin objects replaced by
 * the ids Source declared, and parser objects by the name the parser reports for itself,
 * because both are a package's internal shape.
 */
function normalize(configs: Linter.Config[]): unknown {
  return configs.map((config) => {
    const parser = config.languageOptions?.parser
    return sortKeys({
      ...config,
      ...(config.plugins ? { plugins: Object.keys(config.plugins).sort() } : {}),
      ...(parser ? { languageOptions: { ...config.languageOptions, parser: parserName(parser) } } : {}),
    })
  })
}

/** The name a parser module declares for itself. */
function parserName(parser: unknown): string {
  return (parser as { meta?: { name?: string } })?.meta?.name ?? '<unnamed parser>'
}

function sortKeys(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(sortKeys)
  }
  if (typeof value !== 'object' || value === null) {
    return value
  }
  return Object.fromEntries(
    Object.entries(value)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, entry]) => [key, sortKeys(entry)]),
  )
}

describe('eslint() emission', () => {
  it('emits the house config', async () => {
    // `gitignore` is off because it reads `process.cwd()`, which would tie this snapshot to
    // the repository's own `.gitignore`; a separate test covers the gitignore handling.
    expect(normalize(await eslint({ gitignore: false, isInEditor: false }))).toMatchSnapshot()
  })

  it('emits the editor config', async () => {
    expect(normalize(await eslint({ gitignore: false, isInEditor: true }))).toMatchSnapshot()
  })

  it('emits the stylistic config when the caller turns it on', async () => {
    expect(normalize(await eslint({ gitignore: false, isInEditor: false, stylistic: true }))).toMatchSnapshot()
  })
})

describe('oxlint() emission', () => {
  it('emits the house config', async () => {
    expect(sortKeys(await oxlint({ gitignore: false, isInEditor: false }))).toMatchSnapshot()
  })

  it('emits the root options a type-aware consumer asks for', async () => {
    expect(sortKeys(await oxlint({ gitignore: false, isInEditor: false, oxlint: { typeAware: true, typeCheck: true } })))
      .toMatchSnapshot()
  })

  it('emits the stylistic config when the caller turns it on', async () => {
    expect(sortKeys(await oxlint({ gitignore: false, isInEditor: false, stylistic: true }))).toMatchSnapshot()
  })
})
