import { describe, expect, it } from 'vitest'
import { configNames, loadExample, objectsOfModule } from './helpers/emission'

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
    for (const module of ['jsx', 'unocss', 'vue'] as const) {
      expect(objectsOfModule(eslint, module)).toEqual([])
    }
  })

  it('loads the Oxlint Emission of the same options module', async () => {
    const { oxlint } = await loadExample('next')

    // See the `react` example: loading both Emissions through the registry is what catches a
    // Module that no longer composes on one side.
    expect(oxlint).toBeTypeOf('object')
  })
})
