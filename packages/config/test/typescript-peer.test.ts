import { describe, expect, it, vi } from 'vitest'
import { eslint } from '../src/eslint'

/**
 * A peer plugin is optional: the workspace installs `eslint-plugin-erasable-syntax-only` so the
 * positive path can be tested, so the failing import is mocked here to reach the negative one.
 */
vi.mock('eslint-plugin-erasable-syntax-only', () => {
  throw new Error('module not found')
})

describe('a peer plugin that is not installed', () => {
  it('fails with the package the consumer has to install', async () => {
    await expect(
      eslint({ gitignore: false, isInEditor: false, typescript: { erasableOnly: true } }),
    ).rejects.toThrow(
      /Cannot resolve "eslint-plugin-erasable-syntax-only", which the "erasable-syntax-only" plugin needs\. Install it in your project\./,
    )
  })
})
