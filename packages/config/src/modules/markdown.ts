import type { ConfigObject, RuleKey } from '../types'
import { GLOB_MARKDOWN, GLOB_MARKDOWN_CODE, GLOB_MARKDOWN_IN_MARKDOWN } from '../globs'
import { pluginRef } from '../plugins'
import { rulesEnabledBy } from '../rules'

/**
 * `@eslint/markdown`'s `configs.recommended`, committed as data because Source imports no plugin
 * package; the keys are rewritten from Upstream's `markdown/` prefix to the Plugin id `md`.
 */
const RECOMMENDED_RULES: NonNullable<ConfigObject['rules']> = {
  'md/fenced-code-language': 'error',
  'md/heading-increment': 'error',
  'md/no-duplicate-definitions': 'error',
  'md/no-empty-definitions': 'error',
  'md/no-empty-images': 'error',
  'md/no-empty-links': 'error',
  'md/no-invalid-label-refs': 'error',
  'md/no-missing-atx-heading-space': 'error',
  'md/no-missing-label-refs': 'error',
  'md/no-missing-link-fragments': 'error',
  'md/no-multiple-h1': 'error',
  'md/no-reference-like-urls': 'error',
  'md/no-reversed-media-syntax': 'error',
  'md/no-space-in-emphasis': 'error',
  'md/no-unused-definitions': 'error',
  'md/require-alt-text': 'error',
  'md/table-column-count': 'error',
}

/** Upstream's two deviations from the recommended set. */
const HOUSE_RULES: NonNullable<ConfigObject['rules']> = {
  'md/fenced-code-language': 'off',
  // https://github.com/eslint/markdown/issues/294
  'md/no-missing-label-refs': 'off',
}

/**
 * The JS rules Upstream switches off inside Markdown code blocks: the blocks are illustrative
 * snippets, not modules, so most of the house's rules have nothing to say about them.
 *
 * The list spans several Modules, and Source only keeps the entries whose rule something actually
 * enabled ({@link rulesEnabledBy}): a disable of a rule no Module turns on would name a plugin no
 * config in the Emission declares, and the `style` entries depend on the stylistic option.
 */
const CODE_BLOCK_RULES: NonNullable<ConfigObject['rules']> = {
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
}

/**
 * Upstream's `configs/markdown.ts`: the Markdown language, its processor and its rules.
 *
 * The processor is the plugin's own `markdown` processor merged with a pass-through
 * (`tools.eslint.processor` with `passThrough`), because the processor only creates virtual files for the code
 * blocks and the pass-through lets the `.md` file itself be linted as Markdown too.
 *
 * The code-block object only restates rules the rest of Source turns on, so the Markdown Module
 * needs the enabled set (`Options.overrides`-independent) instead of Upstream's blanket list.
 */
export function markdown(options: {
  componentExts?: string[]
  /** The rule keys the Modules before this one turn on; see {@link rulesEnabledBy}. */
  enabled?: ReadonlySet<RuleKey>
  gfm?: boolean
  overrides?: ConfigObject['rules']
  overridesMarkdown?: ConfigObject['rules']
} = {}): ConfigObject[] {
  const { componentExts = [], enabled = new Set<RuleKey>(), gfm = true, overrides = {}, overridesMarkdown = {} } = options

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
        ...RECOMMENDED_RULES,
        ...HOUSE_RULES,
        ...overridesMarkdown,
      },
    },
    {
      name: 'lumirelle/markdown/disables/code',
      module: 'markdown',
      domain: 'markup',
      files: [
        GLOB_MARKDOWN_CODE,
        ...componentExts.map(ext => `${GLOB_MARKDOWN}/**/*.${ext}`),
      ],
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
        ...rulesEnabledBy(CODE_BLOCK_RULES, enabled),
        ...overrides,
      } as ConfigObject['rules'],
    },
  ]
}
