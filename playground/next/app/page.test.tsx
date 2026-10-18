import { describe, expect, it } from 'vitest'
import Page from './page'

describe('page component', () => {
  it('is a component', () => {
    // Rendering needs `next` and a DOM, which this example deliberately does not install; the file
    // is here so the `test` Module has a target in the App Router tree.
    expect(Page).toBeTypeOf('function')
  })
})
