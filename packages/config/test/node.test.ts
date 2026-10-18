import { describe, expect, it } from 'vitest'
import { GLOB_SRC } from '../src/globs'
import { coverageReport } from '../src/oxlint/report'
import { eslintObject, oxlintObjectWith, rulesOf } from './helpers/emission'

describe('eslint() node module', () => {
  it('declares the plugin on a setup object', async () => {
    const setup = await eslintObject('lumirelle/node/setup')

    expect(Object.keys(setup.plugins ?? {})).toEqual(['node'])
    expect(setup.rules).toBeUndefined()
  })

  it('scopes the rules to source files', async () => {
    expect((await eslintObject('lumirelle/node/rules')).files).toEqual([GLOB_SRC])
  })

  it('enables the rules Upstream enables, with their options', async () => {
    const emitted = rulesOf(await eslintObject('lumirelle/node/rules'))

    expect(emitted['node/handle-callback-err']).toEqual(['error', '^(err|error)$'])
    expect(emitted['node/no-deprecated-api']).toBe('error')
    expect(emitted['node/no-exports-assign']).toBe('error')
    expect(emitted['node/no-new-require']).toBe('error')
    expect(emitted['node/no-path-concat']).toBe('error')
    expect(emitted['node/prefer-global/buffer']).toEqual(['error', 'never'])
    expect(emitted['node/prefer-global/process']).toEqual(['error', 'never'])
    expect(emitted['node/process-exit-as-throw']).toBe('error')
  })
})

describe('oxlint() node module', () => {
  it('maps what Oxlint implements onto the built-in node scope', async () => {
    const emitted = rulesOf(await oxlintObjectWith('node/handle-callback-err'))

    expect(emitted['node/handle-callback-err']).toEqual(['error', '^(err|error)$'])
    expect(emitted['node/no-exports-assign']).toBe('error')
    expect(emitted['node/no-new-require']).toBe('error')
    expect(emitted['node/no-path-concat']).toBe('error')
  })

  it('records the four rules the built-in node scope does not carry', () => {
    expect(coverageReport().modules.node).toEqual([
      { key: 'node/no-deprecated-api', reason: 'unknown-rule' },
      { key: 'node/prefer-global/buffer', reason: 'unknown-rule' },
      { key: 'node/prefer-global/process', reason: 'unknown-rule' },
      { key: 'node/process-exit-as-throw', reason: 'unknown-rule' },
    ])
  })
})
