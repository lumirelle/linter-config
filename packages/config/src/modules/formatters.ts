import type { ConfigObject, FormattersOptions } from '../types'
import {
  GLOB_ASTRO,
  GLOB_ASTRO_TS,
  GLOB_CSS,
  GLOB_GRAPHQL,
  GLOB_HTML,
  GLOB_LESS,
  GLOB_MARKDOWN,
  GLOB_POSTCSS,
  GLOB_SCSS,
  GLOB_SVG,
  GLOB_XML,
} from '../globs'
import { requirePeerPackages } from '../packages'
import { pluginRef } from '../plugins'

/**
 * Upstream's `parserPlain`: a parser that reports the file as one empty `Program`, so a formatter
 * rule sees the raw text and nothing else.
 *
 * It is a plain object, not a package, which is why it lives in Source instead of the Plugin
 * Bundle: `eslint-plugin-format` needs a parser for files no JavaScript parser can read.
 */
const parserPlain = {
  meta: { name: 'parser-plain' },
  parseForESLint: (code: string) => ({
    ast: {
      body: [],
      comments: [],
      loc: { end: code.length, start: 0 },
      range: [0, code.length],
      tokens: [],
      type: 'Program',
    },
    scopeManager: null,
    services: { isPlain: true },
    visitorKeys: { Program: [] },
  }),
}

/** Everything Prettier is asked for, before a per-language override. */
const PRETTIER_OPTIONS = {
  endOfLine: 'auto',
  printWidth: 120,
  semi: false,
  singleQuote: true,
  tabWidth: 2,
  trailingComma: 'all',
  useTabs: false,
} as const

/** The XML plugin's options; Upstream sets all four for the house look. */
const PRETTIER_XML_OPTIONS = {
  xmlQuoteAttributes: 'double',
  xmlSelfClosingSpace: true,
  xmlSortAttributesByKey: false,
  xmlWhitespaceSensitivity: 'ignore',
}

/** The CSS-family objects, which differ only in the Prettier parser they name. */
const STYLE_FORMATTERS: Array<{ files: string[], parser: string, name: string }> = [
  { files: [GLOB_CSS, GLOB_POSTCSS], name: 'lumirelle/formatter/css', parser: 'css' },
  { files: [GLOB_SCSS], name: 'lumirelle/formatter/scss', parser: 'scss' },
  { files: [GLOB_LESS], name: 'lumirelle/formatter/less', parser: 'less' },
]

/** One formatter object: the files it owns, the Domain they belong to, and its single rule. */
function formatter(
  name: string,
  domain: 'data' | 'markup',
  files: string[],
  rules: ConfigObject['rules'],
): ConfigObject {
  return {
    name,
    module: 'formatters',
    domain,
    files,
    tools: {
      eslint: { languageOptions: { parser: parserPlain } },
    },
    plugins: {
      format: pluginRef('format'),
    },
    rules,
  }
}

/**
 * Upstream's `configs/formatters.ts`: hand CSS, HTML, XML, SVG, Markdown, Astro, GraphQL and
 * optional Slidev files to `eslint-plugin-format`.
 *
 * The Module is opt-in (`Options.formatters` defaults to off) and its plugin is a peer, so a
 * consumer who never asks for it never needs `eslint-plugin-format` installed. Every object reads
 * its files with {@link parserPlain}, which is ESLint-only; Oxlint records the whole Module as
 * `eslint-only-domain`.
 *
 * Where Upstream probes the consumer's packages to decide what `formatters: true` enables, the
 * house enables the formatters that need no extra plugin (`css`, `html`, `graphql`, `markdown`)
 * and leaves the plugin-dependent ones (`xml`, `svg`, `astro`, `slidev`) to the object form.
 */
export function formatters(options: FormattersOptions = {}): ConfigObject[] {
  requirePeerPackages('formatters', ['format'])
  const prettierOptions = { ...PRETTIER_OPTIONS, ...options.prettierOptions }

  const configs: ConfigObject[] = [
    {
      name: 'lumirelle/formatter/setup',
      module: 'formatters',
      domain: 'data',
      plugins: {
        format: pluginRef('format'),
      },
    },
  ]

  if (options.css) {
    configs.push(...STYLE_FORMATTERS.map(({ files, name, parser }) => formatter(name, 'data', files, {
      'format/prettier': ['error', { ...prettierOptions, parser }],
    })))
  }

  if (options.html) {
    configs.push(formatter('lumirelle/formatter/html', 'markup', [GLOB_HTML], {
      'format/prettier': ['error', { ...prettierOptions, parser: 'html' }],
    }))
  }

  if (options.xml || options.svg) {
    const xmlOptions = { ...prettierOptions, ...PRETTIER_XML_OPTIONS, parser: 'xml', plugins: ['@prettier/plugin-xml'] }
    if (options.xml) {
      configs.push(formatter('lumirelle/formatter/xml', 'data', [GLOB_XML], {
        'format/prettier': ['error', xmlOptions],
      }))
    }
    if (options.svg) {
      configs.push(formatter('lumirelle/formatter/svg', 'data', [GLOB_SVG], {
        'format/prettier': ['error', xmlOptions],
      }))
    }
  }

  if (options.markdown) {
    const slidevFiles = options.slidev === true
      ? ['**/slides.md']
      : typeof options.slidev === 'object' && options.slidev !== null
        ? options.slidev.files ?? []
        : []

    configs.push(formatter(
      'lumirelle/formatter/markdown',
      'markup',
      [GLOB_MARKDOWN],
      options.markdown === 'dprint'
        ? { 'format/dprint': ['error', { ...options.dprintOptions, language: 'markdown' }] }
        : { 'format/prettier': ['error', { ...prettierOptions, embeddedLanguageFormatting: 'off', parser: 'markdown' }] },
    ))

    if (options.slidev) {
      configs.push(formatter('lumirelle/formatter/slidev', 'markup', slidevFiles, {
        'format/prettier': ['error', {
          ...prettierOptions,
          embeddedLanguageFormatting: 'off',
          parser: 'slidev',
          plugins: ['prettier-plugin-slidev'],
        }],
      }))
    }
  }

  if (options.astro) {
    configs.push(
      formatter('lumirelle/formatter/astro', 'markup', [GLOB_ASTRO], {
        'format/prettier': ['error', { ...prettierOptions, parser: 'astro', plugins: ['prettier-plugin-astro'] }],
      }),
      {
        name: 'lumirelle/formatter/astro/disables',
        module: 'formatters',
        domain: 'data',
        files: [GLOB_ASTRO, GLOB_ASTRO_TS],
        rules: {
          'style/arrow-parens': 'off',
          'style/block-spacing': 'off',
          'style/comma-dangle': 'off',
          'style/indent': 'off',
          'style/no-multi-spaces': 'off',
          'style/quotes': 'off',
          'style/semi': 'off',
        },
      },
    )
  }

  if (options.graphql) {
    configs.push(formatter('lumirelle/formatter/graphql', 'data', [GLOB_GRAPHQL], {
      'format/prettier': ['error', { ...prettierOptions, parser: 'graphql' }],
    }))
  }

  return configs
}
