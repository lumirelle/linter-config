import type { ConfigObject, Options } from '../types'
import { GLOB_ASTRO_TS, GLOB_MARKDOWN, GLOB_SRC, GLOB_TS, GLOB_TSX } from '../globs'
import { isPackageInstalled, requirePeerPackages } from '../packages'
import { pluginRef } from '../plugins'

/**
 * `@eslint-react/eslint-plugin`'s `recommended` set, as `react/` keys.
 *
 * Composed at port time from the installed peer (`configs.recommended.rules`), because the set
 * follows the plugin's version: the Emission cannot import the plugin, so the keys are committed
 * data. Re-read them when the peer's major changes, and let the Coverage report show what Oxlint
 * cannot realize.
 */
const RECOMMENDED_RULES: ConfigObject['rules'] = {
  'react/error-boundaries': 'error',
  'react/exhaustive-deps': 'warn',
  'react/no-access-state-in-setstate': 'error',
  'react/no-array-index-key': 'warn',
  'react/no-children-count': 'warn',
  'react/no-children-for-each': 'warn',
  'react/no-children-map': 'warn',
  'react/no-children-only': 'warn',
  'react/no-children-to-array': 'warn',
  'react/no-clone-element': 'warn',
  'react/no-component-will-mount': 'error',
  'react/no-component-will-receive-props': 'error',
  'react/no-component-will-update': 'error',
  'react/no-context-provider': 'warn',
  'react/no-create-ref': 'error',
  'react/no-direct-mutation-state': 'error',
  'react/no-forward-ref': 'warn',
  'react/no-missing-key': 'error',
  'react/no-nested-component-definitions': 'error',
  'react/no-nested-lazy-component-declarations': 'error',
  'react/no-set-state-in-component-did-mount': 'warn',
  'react/no-set-state-in-component-did-update': 'warn',
  'react/no-set-state-in-component-will-update': 'warn',
  'react/no-unnecessary-use-prefix': 'warn',
  'react/no-unsafe-component-will-mount': 'warn',
  'react/no-unsafe-component-will-receive-props': 'warn',
  'react/no-unsafe-component-will-update': 'warn',
  'react/no-unused-class-component-members': 'warn',
  'react/no-use-context': 'warn',
  'react/purity': 'warn',
  'react/rules-of-hooks': 'error',
  'react/set-state-in-effect': 'warn',
  'react/set-state-in-render': 'error',
  'react/static-components': 'error',
  'react/unsupported-syntax': 'error',
  'react/use-memo': 'error',
  'react/use-state': 'warn',
  'react/jsx-no-children-prop': 'warn',
  'react/jsx-no-children-prop-with-children': 'error',
  'react/jsx-no-comment-textnodes': 'warn',
  'react/jsx-no-key-after-spread': 'error',
  'react/jsx-no-leaked-dollar': 'warn',
  'react/jsx-no-leaked-semicolon': 'warn',
  'react/jsx-no-namespace': 'error',
  'react/rsc-function-definition': 'error',
  'react/dom-no-dangerously-set-innerhtml': 'warn',
  'react/dom-no-dangerously-set-innerhtml-with-children': 'error',
  'react/dom-no-find-dom-node': 'error',
  'react/dom-no-flush-sync': 'error',
  'react/dom-no-hydrate': 'error',
  'react/dom-no-render': 'error',
  'react/dom-no-render-return-value': 'error',
  'react/dom-no-script-url': 'warn',
  'react/dom-no-unsafe-iframe-sandbox': 'warn',
  'react/dom-no-use-form-state': 'error',
  'react/dom-no-void-elements-with-children': 'error',
  'react/web-api-no-leaked-event-listener': 'warn',
  'react/web-api-no-leaked-fetch': 'warn',
  'react/web-api-no-leaked-intersection-observer': 'warn',
  'react/web-api-no-leaked-interval': 'warn',
  'react/web-api-no-leaked-resize-observer': 'warn',
  'react/web-api-no-leaked-timeout': 'warn',
  'react/naming-convention-context-name': 'warn',
  'react/naming-convention-id-name': 'warn',
  'react/naming-convention-ref-name': 'warn',
}

/**
 * Packages whose presence in the project changes what `react-refresh/only-export-components`
 * accepts, exactly as Upstream probes them.
 */
const ALLOW_CONSTANT_EXPORT_PACKAGES = ['vite']
const REMIX_PACKAGES = ['@remix-run/node', '@remix-run/react', '@remix-run/serve', '@remix-run/dev']
const REACT_ROUTER_PACKAGES = ['@react-router/node', '@react-router/react', '@react-router/serve', '@react-router/dev']
const NEXT_PACKAGES = ['next']

/** Next.js route-segment and metadata exports `react-refresh` must not report. */
const NEXT_EXPORT_NAMES = [
  'dynamic',
  'dynamicParams',
  'revalidate',
  'fetchCache',
  'runtime',
  'preferredRegion',
  'maxDuration',
  'generateStaticParams',
  'metadata',
  'generateMetadata',
  'viewport',
  'generateViewport',
  'generateImageMetadata',
  'generateSitemaps',
]

/** Remix and React Router route exports. */
const REMIX_EXPORT_NAMES = [
  'meta',
  'links',
  'headers',
  'loader',
  'action',
  'clientLoader',
  'clientAction',
  'handle',
  'shouldRevalidate',
]

/**
 * Upstream's `configs/react.ts`: `@eslint-react` and `eslint-plugin-react-refresh` for React
 * sources, in Upstream's four objects.
 *
 * The `type-aware-rules` object only exists when the caller names a `tsconfigPath`, because the
 * rule it adds needs the TypeScript project. Both plugins are peers, so the Module asks the
 * project for them before it composes anything.
 */
export function react(options: Pick<Options, 'typescript'> = {}): ConfigObject[] {
  requirePeerPackages('react', ['react', 'react-refresh'])

  const tsconfigPath = typeof options.typescript === 'object' ? options.typescript.tsconfigPath : undefined
  const has = (name: string): boolean => isPackageInstalled(name)

  const configs: ConfigObject[] = [
    {
      name: 'lumirelle/react/setup',
      module: 'react',
      domain: 'js',
      plugins: {
        'react': pluginRef('react'),
        'react-refresh': pluginRef('react-refresh'),
      },
    },
    {
      name: 'lumirelle/react/rules',
      module: 'react',
      domain: 'js',
      files: [GLOB_SRC],
      tools: { eslint: { languageOptions: { sourceType: 'module', parserOptions: { ecmaFeatures: { jsx: true } } } } },
      rules: {
        ...RECOMMENDED_RULES,
        'react-refresh/only-export-components': ['error', {
          allowConstantExport: ALLOW_CONSTANT_EXPORT_PACKAGES.some(has),
          allowExportNames: [
            ...NEXT_PACKAGES.some(has) ? NEXT_EXPORT_NAMES : [],
            ...REMIX_PACKAGES.some(has) || REACT_ROUTER_PACKAGES.some(has) ? REMIX_EXPORT_NAMES : [],
          ],
        }],
      },
    },
    {
      name: 'lumirelle/react/typescript',
      module: 'react',
      domain: 'js',
      files: [GLOB_TS, GLOB_TSX],
      rules: {
        // Already reported by TypeScript itself.
        'react/dom-no-string-style-prop': 'off',
        'react/dom-no-unknown-property': 'off',
      },
    },
  ]

  if (tsconfigPath) {
    configs.push({
      name: 'lumirelle/react/type-aware-rules',
      module: 'react',
      domain: 'js',
      files: [GLOB_TS, GLOB_TSX],
      ignores: [`${GLOB_MARKDOWN}/**`, GLOB_ASTRO_TS],
      rules: {
        'react/no-leaked-conditional-rendering': 'error',
      },
    })
  }

  return configs
}
