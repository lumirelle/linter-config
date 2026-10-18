import { describe, expect, it } from 'vitest'
import { configNames, expectNoModules, loadExample } from './helpers/emission'

describe('the `next` example', () => {
  it('emits the React Config objects its options module shares with the `react` example', async () => {
    const { eslint } = await loadExample('next')
    const names = configNames(eslint)

    // The point of the pair: `react: true` emits the same three objects here as in `react`, and the
    // Next Module only adds to them.
    expect(names).toContain('lumirelle/react/setup')
    expect(names).toContain('lumirelle/react/rules')
    expect(names).toContain('lumirelle/react/typescript')
  })

  it('emits the Next Config objects and the test Module', async () => {
    const { eslint } = await loadExample('next')
    const names = configNames(eslint)

    expect(names).toContain('lumirelle/nextjs/setup')
    expect(names).toContain('lumirelle/nextjs/rules')
    expect(names).toContain('lumirelle/test/rules')
  })

  it('does not emit the JSX, UnoCSS or Vue Config objects', async () => {
    const { eslint } = await loadExample('next')

    // `jsx` is off here on purpose: the React and Next Modules already declare the JSX parser flag
    // for their own files, so the difference between the two examples stays visible.
    expectNoModules(eslint, ['jsx', 'unocss', 'vue'])
  })

  it('loads the Oxlint Emission of the same options module', async () => {
    const { oxlint } = await loadExample('next')

    expect(oxlint).toBeTypeOf('object')
  })
})
