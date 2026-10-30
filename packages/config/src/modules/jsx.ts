import type { ConfigObject } from '../types'
import { GLOB_JSX, GLOB_TSX } from '../globs'

export function jsx(): ConfigObject[] {
  return [
    {
      name: 'lumirelle/jsx/setup',
      module: 'jsx',
      domain: 'js',
      files: [GLOB_JSX, GLOB_TSX],
      tools: { eslint: { languageOptions: { parserOptions: { ecmaFeatures: { jsx: true } } } } },
    },
  ]
}
