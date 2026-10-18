import type { ConfigObject } from '../types'
import { GLOB_JSX, GLOB_TSX } from '../globs'

/**
 * Upstream's `configs/jsx.ts` in its default form: the JSX parser flag for JSX/TSX files and
 * nothing else.
 *
 * Upstream's `a11y` slice pulls in `eslint-plugin-jsx-a11y` and its `flatConfigs.recommended`
 * rule set; that slice is not ported yet, so the Module adds no plugin and Oxlint keeps reading
 * the same `react` / `jsx-a11y` built-in scopes the React Module maps onto.
 */
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
