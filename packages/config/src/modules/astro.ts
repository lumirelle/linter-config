import type { ConfigObject, Options } from '../types'
import { GLOB_ASTRO } from '../globs'
import { requirePeerPackages } from '../packages'
import { pluginRef } from '../plugins'

const STYLISTIC_RULES: ConfigObject['rules'] = {
  'style/indent': 'off',
  'style/jsx-closing-tag-location': 'off',
  'style/jsx-one-expression-per-line': 'off',
  'style/no-multiple-empty-lines': 'off',
}

/**
 * LIMITATION: The globals `environments.astro.globals` are not ported yet.
 */
export function astro(options: Pick<Options, 'stylistic'> = {}): ConfigObject[] {
  requirePeerPackages('astro', ['astro'])

  const stylistic = options.stylistic !== undefined && options.stylistic !== false

  return [
    {
      name: 'lumirelle/astro/setup',
      module: 'astro',
      domain: 'astro',
      plugins: {
        astro: pluginRef('astro'),
      },
    },
    {
      name: 'lumirelle/astro/rules',
      module: 'astro',
      domain: 'astro',
      files: [GLOB_ASTRO],
      tools: {
        eslint: {
          parser: pluginRef('astro'),
          processor: { plugin: pluginRef('astro'), name: 'client-side-ts' },
          languageOptions: {
            sourceType: 'module',
            parserOptions: { extraFileExtensions: ['.astro'], parser: pluginRef('ts') },
          },
        },
      },
      rules: {
        'antfu/no-top-level-await': 'off', // Astro uses it for data fetching
        'astro/missing-client-only-directive-value': 'error',
        'astro/no-conflict-set-directives': 'error',
        'astro/no-deprecated-astro-canonicalurl': 'error',
        'astro/no-deprecated-astro-fetchcontent': 'error',
        'astro/no-deprecated-astro-resolve': 'error',
        'astro/no-deprecated-getentrybyslug': 'error',
        'astro/no-set-html-directive': 'off',
        'astro/no-unused-define-vars-in-style': 'error',
        'astro/semi': 'off',
        'astro/valid-compile': 'error',
        ...(stylistic ? STYLISTIC_RULES : {}),
      },
    },
  ]
}
