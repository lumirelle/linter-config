import type { ConfigObject, RuleKey } from '../types'
import { GLOB_MARKDOWN, GLOB_MARKDOWN_CODE, GLOB_MARKDOWN_IN_MARKDOWN } from '../globs'
import { pluginRef } from '../plugins'
import { rulesEnabledBy } from '../rules'

export function markdown(
  options: {
    componentExts?: string[]
    /** The rule keys the Modules before this one turn on; see {@link rulesEnabledBy}. */
    enabled?: ReadonlySet<RuleKey>
    gfm?: boolean
    overrides?: ConfigObject['rules']
    overridesMarkdown?: ConfigObject['rules']
  } = {},
): ConfigObject[] {
  const {
    componentExts = [],
    enabled = new Set<RuleKey>(),
    gfm = true,
    overrides = {},
    overridesMarkdown = {},
  } = options

  return [
    {
      name: 'lumirelle/markdown/setup',
      module: 'markdown',
      domain: 'markup',
      plugins: {
        md: pluginRef('md'),
      },
    },
    {
      name: 'lumirelle/markdown/processor',
      module: 'markdown',
      domain: 'markup',
      files: [GLOB_MARKDOWN],
      ignores: [GLOB_MARKDOWN_IN_MARKDOWN],
      tools: {
        eslint: { processor: { name: 'markdown', passThrough: true, plugin: pluginRef('md') } },
      },
    },
    {
      name: 'lumirelle/markdown/parser',
      module: 'markdown',
      domain: 'markup',
      files: [GLOB_MARKDOWN],
      tools: {
        eslint: { language: gfm ? 'md/gfm' : 'md/commonmark' },
      },
    },
    {
      name: 'lumirelle/markdown/rules',
      module: 'markdown',
      domain: 'markup',
      files: [GLOB_MARKDOWN],
      rules: {
        'md/heading-increment': 'error',
        'md/no-duplicate-definitions': 'error',
        'md/no-empty-definitions': 'error',
        'md/no-empty-images': 'error',
        'md/no-empty-links': 'error',
        'md/no-invalid-label-refs': 'error',
        'md/no-missing-atx-heading-space': 'error',
        'md/no-missing-link-fragments': 'error',
        'md/no-multiple-h1': 'error',
        'md/no-reference-like-urls': 'error',
        'md/no-reversed-media-syntax': 'error',
        'md/no-space-in-emphasis': 'error',
        'md/no-unused-definitions': 'error',
        'md/require-alt-text': 'error',
        'md/table-column-count': 'error',

        'md/fenced-code-language': 'off',
        // https://github.com/eslint/markdown/issues/294
        'md/no-missing-label-refs': 'off',

        ...overridesMarkdown,
      },
    },
    {
      name: 'lumirelle/markdown/disables/code',
      module: 'markdown',
      domain: 'markup',
      files: [GLOB_MARKDOWN_CODE, ...componentExts.map(ext => `${GLOB_MARKDOWN}/**/*.${ext}`)],
      tools: {
        eslint: {
          languageOptions: {
            parserOptions: {
              ecmaFeatures: {
                impliedStrict: true,
              },
            },
          },
        },
      },
      rules: {
        ...rulesEnabledBy(
          {
            'antfu/no-top-level-await': 'off',

            'e18e/prefer-static-regex': 'off',

            'no-alert': 'off',
            'no-console': 'off',
            'no-labels': 'off',
            'no-lone-blocks': 'off',
            'no-restricted-syntax': 'off',
            'no-undef': 'off',
            'no-unused-expressions': 'off',
            'no-unused-labels': 'off',

            'no-unused-vars': 'off',

            'node/prefer-global/process': 'off',

            'style/comma-dangle': 'off',
            'style/eol-last': 'off',
            'style/padding-line-between-statements': 'off',

            'ts/consistent-type-imports': 'off',
            'ts/explicit-function-return-type': 'off',
            'ts/no-namespace': 'off',
            'ts/no-redeclare': 'off',
            'ts/no-require-imports': 'off',
            'ts/no-unused-expressions': 'off',
            'ts/no-unused-vars': 'off',
            'ts/no-use-before-define': 'off',

            'unicode-bom': 'off',
            'unused-imports/no-unused-imports': 'off',
            'unused-imports/no-unused-vars': 'off',
          },
          enabled,
        ),
        ...overrides,
      },
    },
  ]
}
