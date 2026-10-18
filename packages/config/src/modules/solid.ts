import type { ConfigObject, Options } from '../types'
import { GLOB_JSX, GLOB_TSX } from '../globs'
import { requirePeerPackages } from '../packages'
import { pluginRef } from '../plugins'

/** The rules Upstream enables for Solid sources. */
const SOLID_RULES: ConfigObject['rules'] = {
  'solid/components-return-once': 'warn',
  'solid/event-handlers': ['error', { ignoreCase: false, warnOnSpread: false }],
  'solid/imports': 'error',
  'solid/jsx-no-duplicate-props': 'error',
  'solid/jsx-no-script-url': 'error',
  'solid/jsx-no-undef': 'error',
  'solid/jsx-uses-vars': 'error',
  'solid/no-destructure': 'error',
  'solid/no-innerhtml': ['error', { allowStatic: true }],
  'solid/no-react-deps': 'error',
  'solid/no-react-specific-props': 'error',
  'solid/no-unknown-namespaces': 'error',
  'solid/prefer-for': 'error',
  'solid/reactivity': 'warn',
  'solid/self-closing-comp': 'error',
  'solid/style-prop': ['error', { styleProps: ['style', 'css'] }],
}

/**
 * Upstream's `configs/solid.ts`: `eslint-plugin-solid` over JSX/TSX sources.
 *
 * Upstream parses Solid with `@typescript-eslint/parser` even for `.jsx`, so the Module asks the
 * bundled `ts` Plugin id for it. Oxlint realizes the plugin through `jsPlugins`, with the alias
 * fixed to the Plugin id, so the rule keys are the same in both Emissions.
 */
export function solid(options: Pick<Options, 'typescript'> = {}): ConfigObject[] {
  requirePeerPackages('solid', ['solid'])

  const typescript = options.typescript !== false
  const tsconfigPath = typeof options.typescript === 'object' ? options.typescript.tsconfigPath : undefined

  return [
    {
      name: 'lumirelle/solid/setup',
      module: 'solid',
      domain: 'js',
      plugins: {
        solid: pluginRef('solid'),
      },
    },
    {
      name: 'lumirelle/solid/rules',
      module: 'solid',
      domain: 'js',
      files: [GLOB_JSX, GLOB_TSX],
      tools: {
        eslint: {
          parser: pluginRef('ts'),
          languageOptions: {
            sourceType: 'module',
            parserOptions: {
              ecmaFeatures: { jsx: true },
              ...tsconfigPath ? { project: [tsconfigPath] } : {},
            },
          },
        },
      },
      rules: {
        ...SOLID_RULES,
        // TypeScript already knows which identifiers exist and which namespaces are real, so the
        // plugin only has to check what the types cannot.
        ...typescript
          ? {
              'solid/jsx-no-undef': ['error', { typescriptEnabled: true }],
              'solid/no-unknown-namespaces': 'off',
            }
          : {},
      },
    },
  ]
}
