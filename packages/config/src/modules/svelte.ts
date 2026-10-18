import type { ConfigObject, Options } from '../types'
import { GLOB_SVELTE } from '../globs'
import { requirePeerPackages } from '../packages'
import { pluginRef } from '../plugins'

/**
 * `eslint-plugin-svelte`'s `base` + `recommended` flat configs, flattened the way Upstream
 * flattens them, with the plugin's own version of 3.23.1.
 *
 * The Emission cannot import the plugin, so the composed table is committed data; re-read it when
 * the peer's major changes.
 */
const RECOMMENDED_RULES: ConfigObject['rules'] = {
  'no-inner-declarations': 'off',
  'no-self-assign': 'off',
  'svelte/comment-directive': 'error',
  'svelte/system': 'error',
  'svelte/infinite-reactive-loop': 'error',
  'svelte/no-at-debug-tags': 'warn',
  'svelte/no-at-html-tags': 'error',
  'svelte/no-dom-manipulating': 'error',
  'svelte/no-dupe-else-if-blocks': 'error',
  'svelte/no-dupe-on-directives': 'error',
  'svelte/no-dupe-style-properties': 'error',
  'svelte/no-dupe-use-directives': 'error',
  'svelte/no-export-load-in-svelte-module-in-kit-pages': 'error',
  'svelte/no-immutable-reactive-statements': 'error',
  'svelte/no-inner-declarations': 'error',
  'svelte/no-inspect': 'warn',
  'svelte/no-navigation-without-resolve': 'error',
  'svelte/no-not-function-handler': 'error',
  'svelte/no-object-in-text-mustaches': 'error',
  'svelte/no-raw-special-elements': 'error',
  'svelte/no-reactive-functions': 'error',
  'svelte/no-reactive-literals': 'error',
  'svelte/no-reactive-reassign': 'error',
  'svelte/no-shorthand-style-property-overrides': 'error',
  'svelte/no-store-async': 'error',
  'svelte/no-svelte-internal': 'error',
  'svelte/no-unknown-style-directive-property': 'error',
  'svelte/no-unnecessary-state-wrap': 'error',
  'svelte/no-unused-props': 'error',
  'svelte/no-unused-svelte-ignore': 'error',
  'svelte/no-useless-children-snippet': 'error',
  'svelte/no-useless-mustaches': 'error',
  'svelte/prefer-svelte-reactivity': 'error',
  'svelte/prefer-writable-derived': 'error',
  'svelte/require-each-key': 'error',
  'svelte/require-event-dispatcher-types': 'error',
  'svelte/require-store-reactive-access': 'error',
  'svelte/valid-each-key': 'error',
  'svelte/valid-prop-names-in-kit-pages': 'error',
}

/** The rules Upstream adds while its stylistic option is on. */
const STYLISTIC_RULES: ConfigObject['rules'] = {
  'svelte/derived-has-same-inputs-outputs': 'error',
  'svelte/html-closing-bracket-spacing': 'error',
  'svelte/html-quotes': ['error', { prefer: 'single' }],
  'svelte/indent': ['error', { alignAttributesVertically: true, indent: 2 }],
  'svelte/mustache-spacing': 'error',
  'svelte/no-spaces-around-equal-signs-in-attribute': 'error',
  'svelte/no-trailing-spaces': 'error',
  'svelte/spaced-html-comment': 'error',
  'style/indent': 'off', // superseded by svelte/indent
  'style/no-trailing-spaces': 'off', // superseded by svelte/no-trailing-spaces
}

/**
 * Upstream's `configs/svelte.ts`: `eslint-plugin-svelte` over Svelte components.
 *
 * Svelte needs a parser and a processor, neither of which Oxlint has, so the Module carries the
 * `svelte` Domain and the Oxlint Emission drops it as ESLint-only. Both packages are peers.
 */
export function svelte(options: Pick<Options, 'stylistic' | 'typescript'> = {}): ConfigObject[] {
  requirePeerPackages('svelte', ['svelte'])

  const stylistic = options.stylistic !== undefined && options.stylistic !== false

  return [
    {
      name: 'lumirelle/svelte/setup',
      module: 'svelte',
      domain: 'svelte',
      plugins: {
        svelte: pluginRef('svelte'),
      },
    },
    {
      name: 'lumirelle/svelte/rules',
      module: 'svelte',
      domain: 'svelte',
      files: [GLOB_SVELTE],
      tools: {
        eslint: {
          parser: pluginRef('svelte'),
          processor: { plugin: pluginRef('svelte'), name: '.svelte' },
          languageOptions: {
            parserOptions: {
              extraFileExtensions: ['.svelte'],
              ...options.typescript ? { parser: pluginRef('ts') } : {},
            },
          },
        },
      },
      rules: {
        ...RECOMMENDED_RULES,
        'no-undef': 'off', // incompatible with the attribute-form generic types RFC
        'no-unused-vars': ['error', {
          args: 'none',
          caughtErrors: 'none',
          ignoreRestSiblings: true,
          vars: 'all',
          varsIgnorePattern: '^(\\$\\$Props$|\\$\\$Events$|\\$\\$Slots$)',
        }],
        'unused-imports/no-unused-vars': ['error', {
          args: 'after-used',
          argsIgnorePattern: '^_',
          vars: 'all',
          varsIgnorePattern: '^(_|\\$\\$Props$|\\$\\$Events$|\\$\\$Slots$)',
        }],
        ...stylistic ? STYLISTIC_RULES : {},
      },
    },
  ]
}
