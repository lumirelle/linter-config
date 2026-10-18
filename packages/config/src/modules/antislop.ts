import type { ConfigObject } from '../types'
import { pluginRef } from '../plugins'
import { GLOB_ALL_SRC, GLOB_GRAPHQL, GLOB_JSONC, GLOB_MARKDOWN_CODE, GLOB_SRC, GLOB_TOML } from '../globs'

/**
 * Upstream's `configs/antislop.ts`: a curated `eslint-plugin-slop` set against filler prose and
 * dead code, plus the SonarJS subset that needs no type information.
 *
 * Upstream spreads the package configs; Source declares the rules as data. The plugin ids are
 * peers, so the ESLint Adapter resolves them from the consumer's install and Oxlint loads them
 * through `jsPlugins`. `slop/no-em-dash` applies to every prose-bearing file type, so that object
 * is wider than the `js` domain it declares.
 *
 * @see https://github.com/antfu/eslint-plugin-slop
 * @see https://github.com/SonarSource/SonarJS
 */
export function antislop(): ConfigObject[] {
  return [
    {
      name: 'lumirelle/antislop/setup',
      module: 'antislop',
      domain: 'js',
      plugins: {
        slop: pluginRef('slop'),
        sonar: pluginRef('sonar'),
      },
    },
    {
      name: 'lumirelle/antislop/rules/universal',
      module: 'antislop',
      domain: 'js',
      files: [...GLOB_ALL_SRC, GLOB_JSONC, GLOB_TOML, GLOB_GRAPHQL],
      // Markdown code fences are scanned as part of the Markdown text itself.
      ignores: [GLOB_MARKDOWN_CODE],
      rules: {
        'slop/no-em-dash': 'error',
      },
    },
    {
      name: 'lumirelle/antislop/rules/javascript',
      module: 'antislop',
      domain: 'js',
      files: [GLOB_SRC],
      rules: {
        'slop/max-comment-length': 'error',
        'slop/no-chained-type-assertions': 'error',
        'slop/no-jargon': 'error',
        'slop/no-trivial-functions': 'error',
        'slop/no-trivial-type-aliases': 'error',
        'slop/prefer-jsdoc': 'error',

        'sonar/cognitive-complexity': ['error', 15],
        'sonar/no-all-duplicated-branches': 'error',
        'sonar/no-collapsible-if': 'error',
        'sonar/no-commented-code': 'error',
        'sonar/no-dead-store': 'error',
        'sonar/no-duplicated-branches': 'error',
        'sonar/no-element-overwrite': 'error',
        'sonar/no-empty-collection': 'error',
        'sonar/no-gratuitous-expressions': 'error',
        'sonar/no-identical-conditions': 'error',
        'sonar/no-identical-expressions': 'error',
        'sonar/no-identical-functions': 'error',
        'sonar/no-invariant-returns': 'error',
        'sonar/no-inverted-boolean-check': 'error',
        'sonar/no-redundant-boolean': 'error',
        'sonar/no-redundant-jump': 'error',
        'sonar/no-unused-collection': 'error',
        'sonar/no-use-of-empty-return-value': 'error',
        'sonar/prefer-single-boolean-return': 'error',
      },
    },
  ]
}
