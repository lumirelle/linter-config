import type { Example } from '../../playground/examples'
import { describe, expect, it } from 'vitest'
import { resolveStack } from '../../playground/examples'
import { configNamed, configNames, expectNoModules, loadExample } from './helpers/emission'

/**
 * The build output the example keeps out of both tools, written down here rather than read back
 * from the options module: the patterns are what the stack's README documents, and deriving the
 * expectation from the object under test would let a lost list pass.
 */
const BUILD_OUTPUT = ['dist/**', 'extension/**', '.output/**']

/** The stack's three examples, one per flavor, resolved the way the runner resolves them. */
const EXAMPLES = await resolveStack('webext')

describe('the `eslint-oxlint/webext` example', () => {
  it('emits an application Emission with no framework Config objects', async () => {
    const { eslint } = await loadExample('eslint-oxlint/webext')
    const names = configNames(eslint)

    // A browser extension's manifest and entry points are ordinary TypeScript sources, so the
    // Emission is the plain `javascript` / `typescript` one; `type: 'app'` keeps the library-only
    // rule slices off, and the example enables no framework Module.
    expect(names).toContain('lumirelle/javascript/rules')
    expect(names).toContain('lumirelle/typescript/rules')
    // `test: true` reaches the Emission through the one options module both configs read.
    expect(names).toContain('lumirelle/test/rules')

    expectNoModules(eslint, ['vue', 'react', 'nextjs', 'solid', 'svelte', 'astro', 'angular', 'unocss', 'jsx'])
  })
})

describe('the `webext` build-output ignores', () => {
  it('are asserted on all three flavors, not on the paired one alone', () => {
    // The loop below is only as wide as the flavors the stack ships, so the flavors are named: a
    // stack that lost a flavor directory would otherwise assert one Emission and call it every flavor.
    expect(EXAMPLES.map(example => example.name)).toEqual([
      'eslint/webext',
      'oxlint/webext',
      'eslint-oxlint/webext',
    ])
  })

  it('are the patterns the paired flavor\'s options module declares', () => {
    // The stack's options live in one module, in the paired flavor: the two single-tool flavors write
    // the same entries inline. This is the one place the patterns are readable as data; every flavor
    // then has to carry them into its own Emission below.
    const paired = EXAMPLES.find(example => example.flavor === 'eslint-oxlint')

    expect(paired?.options?.ignores).toEqual(BUILD_OUTPUT)
  })

  // One assertion per Adapter, because the two spell a global ignore differently: ESLint has a
  // `files`-less Config object, and Oxlint has no per-object equivalent.
  describe.each(EXAMPLES)('$name', (example: Example) => {
    it.skipIf(!example.eslint)('reaches the global ignores Config object', () => {
      const ignores = configNamed(example.eslint ?? [], 'lumirelle/ignores')

      // An object with no `files` is the global one: ESLint applies its `ignores` to the whole
      // project, which is what makes the build output invisible to every Module of the Emission.
      expect(ignores.files).toBeUndefined()
      expect(ignores.ignores).toEqual(expect.arrayContaining(BUILD_OUTPUT))
    })

    it.skipIf(!example.oxlint)('reaches the Oxlint Emission\'s root `ignorePatterns`', () => {
      // Oxlint has no global ignores Config object, so the Adapter emits the `lumirelle/ignores`
      // list as the root `ignorePatterns` field — slash-prefixed, which is how Oxlint anchors a
      // pattern at the project root — instead of as an override's `ignores` glob.
      const patterns = (example.oxlint?.ignorePatterns ?? []).map(pattern => pattern.replace(/^\//, ''))

      expect(patterns).toEqual(expect.arrayContaining(BUILD_OUTPUT))
      expect((example.oxlint?.overrides ?? []).some(override => 'ignores' in override)).toBe(false)
    })
  })
})
