import { describe, expect, it } from 'vitest'
import App from './App'

describe('app component', () => {
  it('is a component', () => {
    // Rendering needs `react-dom` and a DOM, which this example deliberately does not install; the
    // file is here so the `test` Module has a target in the tree.
    expect(App).toBeTypeOf('function')
  })
})
