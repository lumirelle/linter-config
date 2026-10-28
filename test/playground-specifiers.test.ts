import { describe, expect, it } from 'vitest'
import { pluginPackageName } from '../playground/specifiers'

describe('a Plugin specifier', () => {
  it('passes a bare package name through unchanged', () => {
    expect(pluginPackageName('eslint-plugin-perfectionist')).toBe('eslint-plugin-perfectionist')
  })

  it('names the scoped package an absolute path into a store resolves to', () => {
    expect(pluginPackageName('/home/dev/.nub/node_modules/@e18e/eslint-plugin/dist/index.mjs'))
      .toBe('@e18e/eslint-plugin')
  })
})
