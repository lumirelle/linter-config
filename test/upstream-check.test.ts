import { describe, expect, it } from 'vitest'
import { checkUpstreamPin } from '../scripts/upstream-check'

const pin = {
  package: '@antfu/eslint-config',
  version: '9.5.1',
  tag: 'v9.5.1',
  submodule: 'upstream/antfu-eslint-config',
}

describe('checkUpstreamPin', () => {
  it('exits 0 when the submodule tag and the installed package match the pin', () => {
    const result = checkUpstreamPin(pin, { submoduleTag: 'v9.5.1', installedVersion: '9.5.1' })

    expect(result).toEqual({ exitCode: 0, mismatches: [] })
  })

  it('exits 1 when the installed package is not the pinned version', () => {
    const result = checkUpstreamPin(pin, { submoduleTag: 'v9.5.1', installedVersion: '9.6.0' })

    expect(result.exitCode).toBe(1)
    expect(result.mismatches).toEqual([
      'installed "@antfu/eslint-config" is 9.6.0, but upstream/pin.json pins 9.5.1',
    ])
  })

  it('exits 1 when the submodule is checked out at another tag', () => {
    const result = checkUpstreamPin(pin, { submoduleTag: 'v9.6.0', installedVersion: '9.5.1' })

    expect(result.exitCode).toBe(1)
    expect(result.mismatches).toEqual([
      'submodule "upstream/antfu-eslint-config" is checked out at v9.6.0, but upstream/pin.json pins v9.5.1',
    ])
  })

  it('exits 1 when the submodule is not checked out', () => {
    const result = checkUpstreamPin(pin, { submoduleTag: undefined, installedVersion: '9.5.1' })

    expect(result.exitCode).toBe(1)
    expect(result.mismatches).toEqual([
      'cannot read the tag of "upstream/antfu-eslint-config"; run "git submodule update --init"',
    ])
  })

  it('exits 1 when the installed package cannot be resolved', () => {
    const result = checkUpstreamPin(pin, { submoduleTag: 'v9.5.1', installedVersion: undefined })

    expect(result.exitCode).toBe(1)
    expect(result.mismatches).toEqual([
      'cannot resolve the installed "@antfu/eslint-config" package; run "nub install"',
    ])
  })
})
