import type { Linter } from 'eslint'
import type { FlatGitignoreOptions } from 'eslint-config-flat-gitignore'
import type { PluginId } from './plugins'

export type { PluginId } from './plugins'

/**
 * The file domain of a Config object.
 * An Adapter filters on it before anything else, because a tool can only read
 * the languages it has a parser or a processor for.
 */
export type Domain
  = | 'js' // JS / TS / JSX / TSX
    | 'vue' // Vue SFC, natively supported by Oxlint
    | 'svelte' // requires a parser; Oxlint cannot read it
    | 'astro' // requires a parser; Oxlint cannot read it
    | 'angular' // requires a parser; Oxlint cannot read it
    | 'data' // JSON / JSONC / YAML / TOML
    | 'markup' // Markdown / HTML
    | 'style' // CSS; reserved for a future stylelint adapter

/**
 * A file pattern, accepted by both minimatch and fast-glob.
 * Only `*`, `**`, `{a,b}` and character classes are allowed, which keeps one
 * glob valid for ESLint and Oxlint at once; `assertGlobVocabulary` enforces it.
 */
export type Glob = string

/** Every rule key is prefixed by a registered Plugin id; unprefixed keys are core rules. */
export type RuleKey = `${PluginId}/${string}` | (string & Record<never, never>)

export type RuleSeverity = Linter.RuleSeverity

export type RuleEntry = RuleSeverity | [RuleSeverity, ...unknown[]]

/**
 * Registry entry for one Plugin id.
 */
export interface PluginDefinition {
  /** `bundle` -> re-exported by a Plugin Bundle; `peer` -> optional peer installed by the consumer. */
  from: 'bundle' | 'peer'
  /** ESLint plugin package, plus the parser/processor glue it needs. */
  eslint: {
    plugin: string
    parser?: string
    processor?: string
  }
  /** Oxlint realization: a built-in scope and/or a `jsPlugins` specifier. */
  oxlint?: {
    builtin?: string
    jsPlugin?: string
    /** Always equals the Plugin id, so rule keys are identical in both tools. */
    alias?: string
  }
}

/**
 * A processor, named as the Plugin id that registers it plus the name it registers it under.
 *
 * Source never imports a plugin package, so it cannot hold the processor object itself; the
 * ESLint Adapter resolves the pair through the plugin it already loads.
 */
export interface ProcessorRef {
  plugin: PluginRef
  name: string
  /**
   * Merge the processor with a pass-through, so the document itself is linted as well as the
   * blocks the processor extracts. The Markdown Module needs both halves.
   */
  passThrough?: boolean
}

declare const pluginRefBrand: unique symbol

/** A branded Plugin id; the runtime value is the id itself. */
export type PluginRef = string & { readonly [pluginRefBrand]: true }

/**
 * A Module of Source: the grouping unit that maps one-to-one to an Upstream `configs/*` file,
 * and the key consumers use for `overrides`.
 */
export type ModuleId
  = | 'ignores'
    | 'javascript'
    | 'typescript'
    | 'imports'
    | 'unicorn'
    | 'node'
    | 'jsdoc'
    | 'test'
    | 'jsx'
    | 'vue'
    | 'nextjs'
    | 'react'
    | 'solid'
    | 'unocss'
    | 'regexp'
    | 'perfectionist'
    | 'e18e'
    | 'antfu'
    | 'command'
    | 'eslint-comments'
    | 'unused-imports'
    | 'antislop'
    | 'stylistic'
    | 'svelte'
    | 'astro'
    | 'angular'
    | 'jsonc'
    | 'yaml'
    | 'toml'
    | 'markdown'
    | 'formatters'
    | 'sort'
    | 'pnpm'
    | 'disables'

/** One ESLint-flat-config-shaped item produced by Source; the shared input of both Adapters. */
export interface ConfigObject {
  /** Public API: `lumirelle/<upstream tail>`, immutable once published. */
  name: string
  module: ModuleId
  domain: Domain
  files?: Glob[]
  ignores?: Glob[]
  /** Declares plugin usage; the ESLint Adapter resolves it to objects, Oxlint derives plugins/jsPlugins. */
  plugins?: Partial<Record<PluginId, PluginRef>>
  /** Both tools have an equivalent: ESLint -> `languageOptions.globals`, Oxlint -> `globals`. */
  globals?: Record<string, boolean>
  rules?: Partial<Record<RuleKey, RuleEntry>>
  /** Root objects only; both tools require settings to be unscoped. */
  settings?: Record<string, unknown>
  tools?: {
    eslint?: {
      /** ESLint-only: the language a parser declares (`jsonc/x`, `markdown/gfm`); Oxlint has no parsers. */
      language?: string
      /**
       * ESLint-only: the Plugin id whose registered parser becomes `languageOptions.parser`.
       *
       * Source names an id rather than importing a parser package, so the ESLint Adapter is the
       * one that resolves it: from the Plugin Bundle, or from the consumer's copy for a peer id.
       */
      parser?: PluginRef
      languageOptions?: Record<string, unknown>
      linterOptions?: Record<string, unknown>
      /** ESLint-only: the processor that turns a component into lintable scripts. */
      processor?: ProcessorRef
    }
    /** `false` marks this object as ESLint-only; the object form carries Oxlint-only fields. */
    oxlint?: false | {
      env?: Record<string, boolean>
      jsPlugins?: Array<string | { name: string, specifier: string }>
    }
  }
}

/** Options for the `formatters` Module, mirroring Upstream's `OptionsFormatters`. */
export interface FormattersOptions {
  css?: 'prettier' | boolean
  html?: 'prettier' | boolean
  xml?: 'prettier' | boolean
  svg?: 'prettier' | boolean
  markdown?: 'prettier' | 'dprint' | boolean
  graphql?: 'prettier' | boolean
  astro?: 'prettier' | boolean
  /** Whether the Slidev `slides.md` file is formatted, and with which files. */
  slidev?: boolean | { files?: string[] }
  prettierOptions?: Record<string, unknown>
  dprintOptions?: Record<string, unknown>
}

/** Options for the `pnpm` Module, mirroring Upstream's `OptionsPnpm`. */
export interface PnpmOptions {
  /** Whether `pnpm/json-enforce-catalog` runs; defaults to whether the workspace declares catalogs. */
  catalogs?: boolean
  /** In an editor the Module stops autofixing, like Upstream. */
  isInEditor?: boolean
  /** The `package.json` objects. */
  json?: boolean
  /** The `yaml/sort-keys` object for `pnpm-workspace.yaml`. */
  sort?: boolean
  /** The stylistic slice of the YAML objects. */
  stylistic?: boolean
  /** The `pnpm-workspace.yaml` objects. */
  yaml?: boolean
}

/**
 * The `indent` option of `@stylistic/eslint-plugin`'s `customize()`: a level, or a level plus the rule
 * options that replace the plugin's own (a plain level keeps them).
 */
export type StylisticIndent = number | 'tab' | [number | 'tab', Record<string, unknown>]

/**
 * Options for the `stylistic` Module: Upstream's `StylisticConfig` (the `customize()` knobs), its
 * `lessOpinionated` switch and this Source's rule overrides.
 */
export interface StylisticOptions {
  braceStyle?: '1tbs' | 'stroustrup' | 'allman'
  experimental?: boolean
  indent?: StylisticIndent
  jsx?: boolean
  quotes?: 'single' | 'double' | 'backtick'
  semi?: boolean
  lessOpinionated?: boolean
  overrides?: ConfigObject['rules']
}

/** Options for the `.gitignore` handling; `eslint-config-flat-gitignore` owns the shape. */
export type { FlatGitignoreOptions }

export interface OxlintOptions {
  typeAware?: boolean
  typeCheck?: boolean
}

/**
 * The same options object configures both factories, so the two emissions cannot
 * drift by configuration. Fields mirror Upstream.
 */
export interface Options {
  vue?: boolean | { a11y?: boolean, vueVersion?: 2 | 3, sfcBlocks?: boolean }
  react?: boolean
  svelte?: boolean
  astro?: boolean
  solid?: boolean
  angular?: boolean
  nextjs?: boolean
  node?: boolean
  /**
   * The `test` Module. Upstream accepts the flag or an object carrying this Module's rule
   * overrides; `overrides.test` reaches the same rules through the shared override map.
   */
  test?: boolean | { overrides?: ConfigObject['rules'] }
  jsonc?: boolean
  yaml?: boolean
  toml?: boolean
  markdown?: boolean
  jsdoc?: boolean
  imports?: boolean
  unicorn?: boolean
  perfectionist?: boolean
  /**
   * The `pnpm` Module, for `package.json` and `pnpm-workspace.yaml`.
   *
   * @default detected: on when the project has a `pnpm-workspace.yaml`, like Upstream; the object
   * form carries the Module's own options, and `catalogs` defaults to whether that file declares
   * a `catalog:` block
   */
  pnpm?: boolean | PnpmOptions
  e18e?: boolean
  antislop?: boolean
  sonarjs?: boolean
  regexp?: boolean
  unocss?: boolean
  formatters?: boolean | FormattersOptions
  /** Defaults to false: this project formats with oxfmt (`objectWrap: preserve`). */
  stylistic?: boolean | StylisticOptions
  /**
   * Fold the project's `.gitignore` into the global ignores.
   *
   * @default true, reading `.gitignore` from `process.cwd()`; a project without one gets no
   * extra ignores. `false` turns the handling off, and the object form passes options to
   * `eslint-config-flat-gitignore` (`cwd`, `files`, `strict`, ...)
   */
  gitignore?: boolean | FlatGitignoreOptions
  type?: 'lib' | 'app'
  typescript?: boolean | { tsconfigPath?: string, erasableOnly?: boolean }
  jsx?: boolean
  componentExts?: string[]
  ignores?: string[]
  /**
   * Whether the factory runs inside an editor integration, where autofixable rules report
   * as warnings instead of errors.
   *
   * @default detected from the environment: false under `CI` and in git hooks or lint-staged,
   * true for VS Code, JetBrains, Vim, Neovim and Zed
   */
  isInEditor?: boolean
  /**
   * Deep rule/scope merge, equivalent to Upstream's `overrides` option. A key is either a
   * Module (every object of that Module) or one Config object name (`lumirelle/<tail>`), so a
   * single object can be targeted, e.g. `typescript/overrides-type-aware`.
   */
  overrides?: Partial<Record<ModuleId | `lumirelle/${string}`, Pick<ConfigObject, 'rules' | 'files' | 'ignores'>>>
  /** ESLint-side Bridge: turn off rules already handled by Oxlint. */
  oxlint?: boolean | OxlintOptions
}
