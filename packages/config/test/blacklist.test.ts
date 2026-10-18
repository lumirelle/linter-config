import type { OxlintConfig } from 'oxlint'
import { fileURLToPath } from 'node:url'
import { jsPlugins } from '@lumirelle/linter-plugins-oxlint'
import { afterAll, describe, expect, it } from 'vitest'
import { oxlint } from '../src/oxlint'
import { blacklistEntry, OXLINT_BLACKLIST } from '../src/oxlint/blacklist'
import { coverageReport } from '../src/oxlint/report'
import { mapRules } from '../src/oxlint/rule-map'
import { jsPluginDeclarations } from './helpers/emission'
import { project, runOxlint, scratchDirectory } from './helpers/oxlint-binary'

const FIXTURES = fileURLToPath(new URL('./fixtures/eslint-comments/', import.meta.url))
const RULE = 'eslint-comments/no-unlimited-disable'
const scratch = scratchDirectory()

afterAll(() => {
  scratch.remove()
})

/**
 * The blacklisted plugin on its own, the way the Emission would have declared it: the Emission
 * drops it, so replaying the failure means asking the binary directly.
 */
const probe: OxlintConfig = {
  categories: { correctness: 'off' },
  overrides: [
    {
      files: ['**/*.js'],
      jsPlugins: [{ name: 'eslint-comments', specifier: specifierOf('eslint-comments') }],
      rules: { [RULE]: 'error' },
    },
  ],
}

/** The specifier the bundle publishes for that Plugin id; a missing one fails loudly. */
function specifierOf(id: string): string {
  const specifier = jsPlugins[id]
  if (!specifier) {
    throw new Error(`the Oxlint bundle declares no specifier for "${id}"`)
  }
  return specifier
}

describe('the Oxlint plugin blacklist', () => {
  it('replays the recorded eslint-comments failure through the real Oxlint', () => {
    const directory = project(scratch.directory, 'eslint-comments', probe, FIXTURES)
    const { output } = runOxlint(directory, ['fixtures/block-directive.js'])

    // The rule exists to see exactly this block directive, and Oxlint's report shim throws on it:
    // the run reports the plugin error instead of the diagnostic, so the rule reaches nothing.
    expect(output).toMatch(/Error running JS plugin/u)
    expect(output).not.toMatch(/eslint-comments\(no-unlimited-disable\)/u)
  })

  it('records the dropped plugin and its failure in the Coverage report', () => {
    const recorded = coverageReport().blacklist.find(entry => entry.id === 'eslint-comments')

    expect(recorded).toBeDefined()
    expect(recorded?.failure).toMatch(/RangeError/u)
  })

  it('reports a blacklisted rule as dropped, naming the plugin', () => {
    // No Module emits an `eslint-comments` rule yet, so the widest Source has none to report;
    // the mapping itself is what has to name the plugin once one does.
    expect(mapRules({ [RULE]: 'off' }).unemitted).toEqual([
      { key: RULE, reason: 'blacklisted-plugin', plugin: 'eslint-comments' },
    ])
  })

  it('keeps a blacklisted plugin out of the Emission, declarations included', async () => {
    const config = await oxlint({ gitignore: false, isInEditor: false })

    expect(jsPluginDeclarations(config).map(entry => entry.name)).not.toContain('eslint-comments')
    expect(JSON.stringify(config)).not.toContain(`${RULE}`)
  })

  it('documents a failure for every entry, and resolves each entry by its Plugin id', () => {
    for (const entry of OXLINT_BLACKLIST) {
      expect(entry.failure.length).toBeGreaterThan(0)
      expect(blacklistEntry(entry.id)).toBe(entry)
    }
  })
})
