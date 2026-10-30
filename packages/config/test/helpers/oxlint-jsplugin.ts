import type { PluginId, RuleKey } from '../../src/types'
import { join } from 'node:path'
import { expect } from 'vitest'
import { oxlint } from '../../src/oxlint'
import { jsPluginDeclarations } from './emission'
import { lint, project, scratchDirectory } from './oxlint-binary'

/** One Plugin the Emission loads through `jsPlugins`, with the files that prove it works. */
export interface JsPluginProbe {
  /** The Plugin id; Oxlint must see it as the alias, so it is also the rule key's prefix. */
  plugin: PluginId
  /** The Oxlint rule key that must fire, spelled the way the Emission emits it. */
  rule: RuleKey
  /** The directory both fixtures are linted from: the Emission's fixtures for this plugin. */
  fixtures: string
  /** The fixture `rule` must fire on, relative to `fixtures`. */
  fixture: string
  /** The fixture it must stay quiet on, relative to `fixtures`. */
  clean: string
  /** Options on top of the house defaults that turn `rule` on. */
  options?: Parameters<typeof oxlint>[0]
}

/**
 * Proves one Plugin id works through Oxlint's `jsPlugins`: the Emission declares it, the real
 * binary loads the package, and the exact rule key fires on a violating fixture while staying
 * quiet on a clean one.
 *
 * Only diagnostics of `rule` count in either direction. The Emission has hundreds of other rules
 * that may report on the same file, and a probe that accepted them would pass for a plugin Oxlint
 * never loaded. A Plugin the blacklist dropped has no declaration to find, so this fails first on
 * the declaration rather than reporting a missing diagnostic.
 */
export async function expectJsPluginFires(probe: JsPluginProbe): Promise<void> {
  const config = await oxlint({ gitignore: false, isInEditor: false, ...probe.options })
  const declared = jsPluginDeclarations(config).filter(entry => entry.name === probe.plugin)

  expect(declared, `${probe.plugin} should be declared once`).toHaveLength(1)
  expect(
    probe.rule.startsWith(`${probe.plugin}/`),
    `${probe.rule} is spelled with the ${probe.plugin} alias`,
  ).toBe(true)

  const scratch = scratchDirectory('lumirelle-jsplugin-')
  try {
    const directory = project(scratch.directory, probe.plugin, config, probe.fixtures)
    const fired = lint(directory, [join('fixtures', probe.fixture)]).diagnostics.filter(
      diagnostic => diagnostic.ruleId === probe.rule,
    )
    const quiet = lint(directory, [join('fixtures', probe.clean)]).diagnostics.filter(
      diagnostic => diagnostic.ruleId === probe.rule,
    )

    expect(fired.length, `${probe.rule} should fire on ${probe.fixture}`).toBeGreaterThan(0)
    expect(quiet, `${probe.rule} should not fire on ${probe.clean}`).toEqual([])
  } finally {
    scratch.remove()
  }
}
