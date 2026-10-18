import { describe, expect, it } from 'vitest'
import { configNamed, configNames, expectNoModules, loadExample } from './helpers/emission'

describe('the `webext` example', () => {
  it('emits an application Emission with no framework Config objects', async () => {
    const { eslint } = await loadExample('webext')
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

  it('applies the declared build-output ignores to the global ignores Config object', async () => {
    const { options, eslint } = await loadExample('webext')
    const ignores = configNamed(eslint, 'lumirelle/ignores')

    // The patterns come from the options module, which is the only place that names them.
    expect(options.ignores).not.toEqual([])
    // An object with no `files` is the global one: ESLint applies its `ignores` to the whole
    // project, which is what makes the build output invisible to every Module of the Emission.
    expect(ignores.files).toBeUndefined()
    expect(ignores.ignores).toEqual(expect.arrayContaining(options.ignores ?? []))
  })
})
