import type { Linter } from 'eslint'
import type { FlatGitignoreOptions } from 'eslint-config-flat-gitignore'
import type { PluginId } from './plugins'

export type { PluginId } from './plugins'

/**
 * The file domain of a Config object.
 */
export type Domain =
  | 'js' // JS / TS / JSX / TSX
  | 'vue' // Vue SFC, natively supported by Oxlint
  | 'svelte' // requires a parser; Oxlint cannot read it
  | 'astro' // requires a parser; Oxlint cannot read it
  | 'angular' // requires a parser; Oxlint cannot read it
  | 'data' // JSON / JSONC / YAML / TOML
  | 'markup' // Markdown / HTML
  | 'style' // CSS; reserved for a future stylelint adapter

/**
 * A file pattern, accepted by both minimatch and fast-glob.
 *
 * Only `*`, `**`, `{a,b}` and character classes are allowed, which keeps one
 * glob valid for ESLint and Oxlint at once; `assertGlobVocabulary` enforces it.
 */
export type Glob = string

/** Rule key, prefixed by a registered Plugin id and unprefixed keys are core rules. */
export type RuleKey = `${PluginId}/${string}` | (string & Record<never, never>)

export type RuleSeverity = Linter.RuleSeverity

export type RuleEntry = RuleSeverity | [RuleSeverity, ...unknown[]]

/**
 * Registry entry for one Plugin id.
 */
export interface PluginDefinition {
  /** `bundle` -> re-exported by Bundle (`@lumirelle/linter-plugins-xxx`); `peer` -> optional peer installed by the user. */
  from: 'bundle' | 'peer'
  /** ESLint plugin package, plus the parser/processor glue it needs. */
  eslint: {
    plugin: string
    parser?: string
    processor?: string
  }
  /**
   * Oxlint realization: a built-in scope and/or a `jsPlugins` specifier.
   *
   * Absent for the plugins Oxlint cannot load: the plugins that need a parser or a processor of their
   * own (`angular`, `astro`, `jsonc`, `md`, `pnpm`, `svelte`, `toml`, `yaml`), the
   * `eslint-comments` blacklist, and the plugins with no `jsPlugins` equivalent.
   */
  oxlint?: {
    builtin?: string
    jsPlugin?: string
    /** Always equals the Plugin id, to ensure the rule keys identical with ESLint. */
    alias?: string
  }
}

/**
 * A processor, named as the Plugin id that registers it plus the name it registers it under.
 */
export interface ProcessorRef {
  plugin: PluginRef
  name: string
  /**
   * Merge the processor with a pass-through, so the document itself is linted as well as the
   * blocks the processor extracts. The Markdown Module needs both halves.
   */
  passThrough?: boolean
  /** Options for a processor the Bundle builds on demand (Vue's SFC block glue selects blocks this way). */
  options?: Record<string, unknown>
}

declare const pluginRefBrand: unique symbol

/** A branded Plugin id; the runtime value is the id itself. */
export type PluginRef = string & { readonly [pluginRefBrand]: true }

/**
 * A Module of Source: the grouping unit that maps one-to-one to an Upstream `configs/*` file,
 * and the key consumers use for `overrides`.
 */
export type ModuleId =
  | 'ignores'
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
  /** Public API: `lumirelle/{upstream_tail}`, immutable once published. */
  name: string
  module: ModuleId
  domain: Domain
  files?: Glob[]
  ignores?: Glob[]
  /** Declares plugin usage; the ESLint Adapter resolves it to objects, Oxlint derives plugins/jsPlugins. */
  plugins?: Partial<Record<PluginId, PluginRef>>
  /** ESLint -> `languageOptions.globals`, Oxlint -> `globals`. */
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
       * Source names an id rather than importing a parser package, ESLint Adapter resolves it:
       * from the Plugin Bundle, or from the user's copy for a peer id.
       */
      parser?: PluginRef
      languageOptions?: Record<string, unknown>
      linterOptions?: Record<string, unknown>
      /** ESLint-only: the processor that turns a component into lintable scripts. */
      processor?: ProcessorRef
    }
    /** `false` marks this object as ESLint-only; the object form carries Oxlint-only fields. */
    oxlint?:
      | false
      | {
          env?: Record<string, boolean>
          jsPlugins?: Array<string | { name: string; specifier: string }>
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
 * Linter options for both ESLint & Oxlint.
 */
export interface Options {
  /**
   * The `vue` Module.
   *
   * Both Emissions carry the rules: Oxlint reads Vue single-file components natively, except
   * the `sfcBlocks` object form, which needs a processor and is therefore ESLint-only.
   *
   * Opt-in, and `eslint-plugin-vuejs-accessibility` is a peer once `a11y` is on.
   *
   * @default false
   */
  vue?:
    | boolean
    | {
        a11y?: boolean
        vueVersion?: 2 | 3
        /** SFC block linting: `false` keeps only the Vue processor, an object narrows what it extracts. */
        sfcBlocks?: boolean | Record<string, unknown>
      }
  /**
   * The `react` Module.
   *
   * Both Emissions carry it: the ESLint side loads the peer `@eslint-react/eslint-plugin`, Oxlint
   * its built-in `react` scope.
   *
   * Opt-in, and the plugin is a peer.
   *
   * @default false
   */
  react?: boolean
  /**
   * The `svelte` Module.
   *
   * ESLint-only: Svelte needs a parser which Oxlint does not support.
   *
   * Opt-in, and `eslint-plugin-svelte` and `svelte-eslint-parser` are peers.
   *
   * @default false
   */
  svelte?: boolean
  /**
   * The `astro` Module.
   *
   * ESLint-only, for the same reason as {@link Options.svelte}.
   *
   * Opt-in, and the plugin and its parser are peers.
   *
   * @default false
   */
  astro?: boolean
  /**
   * The `solid` Module.
   *
   * Both Emissions carry it: Oxlint loads `eslint-plugin-solid` through `jsPlugins`.
   *
   * Opt-in, and the plugin is a peer.
   *
   * @default false
   */
  solid?: boolean
  /**
   * The `angular` Module.
   *
   * ESLint-only: TypeScript needs a parser here, and the template rules a
   * second parser of their own.
   *
   * Opt-in, and both `@angular-eslint` plugins and the template parser are peers.
   *
   * @default false
   */
  angular?: boolean
  /**
   * The `nextjs` Module.
   *
   * Both Emissions carry it: Oxlint has a built-in `nextjs` scope.
   *
   * Opt-in, and `@next/eslint-plugin-next` is a peer.
   *
   * @default false
   */
  nextjs?: boolean
  /**
   * The `node` Module: `node:` protocol imports, Node globals and CLI entry points.
   *
   * Both Emissions carry it: Oxlint has a built-in `node` scope.
   *
   * @default true
   */
  node?: boolean
  /**
   * The `test` Module.
   *
   * @default true
   */
  test?: boolean | { overrides?: ConfigObject['rules'] }
  /**
   * The `jsonc` Module: `package.json`, `tsconfig.json` and every other `.json` or `.jsonc` file.
   *
   * ESLint-only: the objects carry `language: 'jsonc/x'`, and Oxlint has no parser hook, so the
   * Oxlint Emission records the Module as `eslint-only-domain`.
   *
   * @default true
   */
  jsonc?: boolean
  /**
   * The `yaml` Module.
   *
   * ESLint-only: YAML needs a parser.
   *
   * @default true
   */
  yaml?: boolean
  /**
   * The `toml` Module.
   *
   * ESLint-only: TOML needs a parser.
   *
   * @default true
   */
  toml?: boolean
  /**
   * The `markdown` Module, including the code blocks inside a document, which it lints as the
   * language they are written in.
   *
   * ESLint-only: Markdown needs a processor.
   *
   * @default true
   */
  markdown?: boolean
  /**
   * The `jsdoc` Module.
   *
   * Both Emissions carry it: Oxlint has a built-in `jsdoc` scope.
   *
   * @default true
   */
  jsdoc?: boolean
  /**
   * The `imports` Module.
   *
   * Both Emissions carry it: Oxlint has a built-in `import` scope.
   *
   * @default true
   */
  imports?: boolean
  /**
   * The `unicorn` Module.
   *
   * Both Emissions carry it: Oxlint has a built-in `unicorn` scope.
   *
   * @default true
   */
  unicorn?: boolean
  /**
   * The `perfectionist` Module.
   *
   * Both Emissions carry it: Oxlint loads the plugin through `jsPlugins`.
   *
   * @default true
   */
  perfectionist?: boolean
  /**
   * The `pnpm` Module, for `package.json` and `pnpm-workspace.yaml`.
   *
   * ESLint-only: both files need parsers.
   *
   * @default detected: on when the project has a `pnpm-workspace.yaml`
   */
  pnpm?: boolean | PnpmOptions
  /**
   * The `e18e` Module.
   *
   * Both Emissions carry it: Oxlint loads `@e18e/eslint-plugin` through `jsPlugins`.
   *
   * @default true
   */
  e18e?: boolean
  /**
   * The `antislop` Module: the `eslint-plugin-slop` set against filler prose and dead code, plus
   * the SonarJS subset that needs no type information. This Module is where the `sonar/` rules
   * live, so there is no separate `sonarjs` option.
   *
   * Both Emissions carry it, through `jsPlugins` for both plugins.
   *
   * Opt-in, and `eslint-plugin-slop` and `eslint-plugin-sonarjs` are peers.
   *
   * @default false
   */
  antislop?: boolean
  /**
   * The `regexp` Module.
   *
   * Both Emissions carry it: Oxlint loads the plugin through `jsPlugins`, and
   * its rules are conformance-tested against it.
   *
   * @default true
   */
  regexp?: boolean
  /**
   * The `unocss` Module.
   *
   * Both Emissions carry it: Oxlint loads the plugin through `jsPlugins`.
   *
   * Opt-in, and `unocss` is a peer.
   *
   * @default false
   */
  unocss?: boolean
  /**
   * The `formatters` Module: Prettier, or dprint, over the languages ESLint does not lint for
   * style.
   *
   * ESLint-only: it needs a plain-text parser and processors, and Oxlint has neither.
   *
   * Opt-in, and `eslint-plugin-format` is a peer.
   *
   * @default false
   */
  formatters?: boolean | FormattersOptions
  /**
   * The `stylistic` Module.
   *
   * Both Emissions carry it: Oxlint loads `@stylistic/eslint-plugin` through `jsPlugins`.
   *
   * Opt-in, and `@stylistic/eslint-plugin` is a peer.
   *
   * @default false
   */
  stylistic?: boolean | StylisticOptions
  /**
   * Fold the project's `.gitignore` into the global ignores.
   *
   * @default true
   */
  gitignore?: boolean | FlatGitignoreOptions
  /**
   * Whether the project ships an API. `'lib'` has more strict rules.
   *
   * @default 'app'
   */
  type?: 'lib' | 'app'
  /**
   * The `typescript` Module: the parser, the settings derived from it and the rules that need no
   * type information.
   *
   * Both Emissions carry it, but a rule that needs a TypeScript program runs on ESLint only unless
   * Oxlint's type-aware mode is on ({@link Options.oxlint}): Oxlint reads type information in its
   * own mode, never through `tsconfigPath` the way the ESLint parser does. The object form turns
   * type information on by naming that tsconfig, and `erasableOnly` additionally requires syntax
   * that can be stripped without a transform.
   *
   * @default detected: on when `typescript` or `@typescript/native-preview` is installed
   */
  typescript?: boolean | { tsconfigPath?: string; erasableOnly?: boolean }
  /**
   * The `jsx` Module: the JSX parser options and settings on their own, without the React rules
   * ({@link Options.react}).
   *
   * Both Emissions carry it: Oxlint has built-in `react` and `jsx-a11y` scopes.
   *
   * @default false
   */
  jsx?: boolean
  /**
   * Extra component extensions. They widen the TypeScript Module's file patterns and the fenced
   * blocks the `markdown` Module lints, which is how a single-file component's script is typed and
   * how its examples are checked. {@link Options.vue} adds `vue` itself.
   *
   * @default `[]`
   */
  componentExts?: string[]
  /**
   * Extra patterns for the global `ignores` object, added to the house excludes and to the
   * project's `.gitignore` ({@link Options.gitignore}).
   *
   * @default `[]`
   */
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
   * Deep rule/scope merge.
   */
  overrides?: Partial<
    Record<ModuleId | `lumirelle/${string}`, Pick<ConfigObject, 'rules' | 'files' | 'ignores'>>
  >
  /**
   * Use to let Oxlint runs the supported rules other than ESLint.
   *
   * This will calculate on what rules are used by `@lumirelle/linter-config/oxlint`, and turn them
   * off inside `@lumirelle/linter-config/eslint`.
   *
   * A rule Oxlint does not support (see `coverage.json`) always stays on.
   *
   * The object form carries Oxlint's root options, a type-aware rule on ESLint is turned off only when
   * Oxlint is type-aware.
   *
   * @default false
   */
  oxlint?: boolean | OxlintOptions
}
