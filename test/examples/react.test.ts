import { describe, expect, it } from 'vitest'
import { configNames, expectNoModules, loadExample } from './helpers/emission'

describe('the `eslint-oxlint/react` example', () => {
  it('emits the React Config objects a React single-page application asks for', async () => {
    const { eslint } = await loadExample('eslint-oxlint/react')
    const names = configNames(eslint)

    // `react: true` brings both peers and the three objects; the type-aware one stays out because
    // the example names no `typescript.tsconfigPath`.
    expect(names).toContain('lumirelle/react/setup')
    expect(names).toContain('lumirelle/react/rules')
    expect(names).toContain('lumirelle/react/typescript')
    expect(names).not.toContain('lumirelle/react/type-aware-rules')
  })

  it('emits the JSX, UnoCSS and test Config objects its options module turns on', async () => {
    const { eslint } = await loadExample('eslint-oxlint/react')
    const names = configNames(eslint)

    expect(names).toContain('lumirelle/unocss/setup')
    expect(names).toContain('lumirelle/test/rules')
  })

  it('does not emit the Next or Vue Config objects', async () => {
    const { eslint } = await loadExample('eslint-oxlint/react')

    expectNoModules(eslint, ['nextjs', 'vue'])
  })

  it('loads the Oxlint Emission of the same options module', async () => {
    const { oxlint } = await loadExample('eslint-oxlint/react')

    // Oxlint has no parser, processor or plugin setup to resolve here, but a Module that stops
    // composing fails on both sides.
    expect(oxlint).toBeTypeOf('object')
  })
})
