import type { ConfigObject } from '../types'
import { GLOB_SRC } from '../globs'
import { requirePeerPackages } from '../packages'
import { pluginRef } from '../plugins'

/**
 * `@next/eslint-plugin-next`'s `recommended` and `core-web-vitals` sets, merged in that order as
 * Upstream merges them and spelled with the canonical `next/` prefix.
 *
 * Composed at port time from the installed peer (16.4.2), because the sets follow the plugin's
 * version: Source cannot import the plugin, so the keys are committed data. Upstream throws when a
 * config name disappears; re-read this table when the peer's major changes.
 */
const NEXT_RULES: ConfigObject['rules'] = {
  'next/google-font-display': 'warn',
  'next/google-font-preconnect': 'warn',
  'next/next-script-for-ga': 'warn',
  'next/no-async-client-component': 'warn',
  'next/no-before-interactive-script-outside-document': 'warn',
  'next/no-css-tags': 'warn',
  'next/no-head-element': 'warn',
  'next/no-html-link-for-pages': 'error',
  'next/no-img-element': 'warn',
  'next/no-location-assign-relative-destination': 'warn',
  'next/no-page-custom-font': 'warn',
  'next/no-styled-jsx-in-document': 'warn',
  'next/no-sync-scripts': 'error',
  'next/no-title-in-document-head': 'warn',
  'next/no-typos': 'warn',
  'next/no-unwanted-polyfillio': 'warn',
  'next/inline-script-id': 'error',
  'next/no-assign-module-variable': 'error',
  'next/no-document-import-in-page': 'error',
  'next/no-duplicate-head': 'error',
  'next/no-head-import-in-document': 'error',
  'next/no-script-component-in-head': 'error',
}

/**
 * Upstream's `configs/nextjs.ts`: `@next/eslint-plugin-next` for Next.js projects.
 *
 * Upstream puts `settings.react.version` on the scoped rules object; Source keeps `settings` on
 * root objects only, so it moves to the setup object and reaches the same files.
 */
export function nextjs(): ConfigObject[] {
  requirePeerPackages('nextjs', ['next'])

  return [
    {
      name: 'lumirelle/nextjs/setup',
      module: 'nextjs',
      domain: 'js',
      plugins: {
        next: pluginRef('next'),
      },
      settings: { react: { version: 'detect' } },
    },
    {
      name: 'lumirelle/nextjs/rules',
      module: 'nextjs',
      domain: 'js',
      files: [GLOB_SRC],
      tools: { eslint: { languageOptions: { sourceType: 'module', parserOptions: { ecmaFeatures: { jsx: true } } } } },
      rules: NEXT_RULES,
    },
  ]
}
