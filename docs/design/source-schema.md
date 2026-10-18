# Source Schema

Status: accepted — implemented. Source, both Adapters and the Bridge live in [`packages/config/src`](../../packages/config/src); this document stays the reference for their field-level shape, invariants and algorithms.

Terms are defined in [GLOSSARY.md](../../GLOSSARY.md). The decisions behind this shape are [ADR 0001](../adr/0001-source-and-composers.md) (Source is a function graph; both artifacts go through a Composer), [ADR 0002](../adr/0002-plugin-bundles.md) (plugin dependencies live in two Bundles) and [ADR 0003](../adr/0003-generated-rule-tables.md) (plugin rule tables stay committed data).

## Goals

- Every Module is an `(options) => ConfigObject[]`; module names map one-to-one to Upstream's `configs/*`. The implemented module list and composition order are [`packages/config/src/source.ts`](../../packages/config/src/source.ts); each Module is one file under [`packages/config/src/modules`](../../packages/config/src/modules).
- A Config object is plain ESLint-flat-config-shaped data; both Adapters consume only that.
- Shared fields carry semantics both tools understand; tool-specific fields live under `tools`.

## Types

```ts
/** Equals Upstream's post-rename rule prefix, e.g. ts / test / import / style */
type PluginId
  = | 'ts' | 'test' | 'import' | 'node' | 'unicorn' | 'jsdoc' | 'vue' | 'vue-a11y'
    | 'react' | 'react-refresh' | 'next' | 'jsx-a11y' | 'style' | 'perfectionist'
    | 'regexp' | 'e18e' | 'antfu' | 'command' | 'eslint-comments' | 'unused-imports'
    | 'sonar' | 'slop' | 'unocss' | 'solid' | 'svelte' | 'astro' | 'format'
    | 'erasable-syntax-only' | 'angular' | 'angular-template' | 'jsonc' | 'yaml'
    | 'toml' | 'md' | 'pnpm'
// The full list is defined by the registry in src/plugins.ts; this type derives from it

/** Which files a Config object handles; an Adapter uses it as its first filter */
type Domain
  = | 'js' // JS / TS / JSX / TSX
    | 'vue' // Vue SFC (natively supported by Oxlint)
    | 'svelte' | 'astro' | 'angular' // require a parser; Oxlint cannot
    | 'data' // JSON / JSONC / YAML / TOML
    | 'markup' // Markdown / HTML
    | 'style' // CSS, reserved for a future stylelint adapter

type Glob = string // only * ** {a,b} and character classes
type RuleKey = `${PluginId}/${string}` | string // unprefixed keys are core rules
type RuleEntry = RuleSeverity | [RuleSeverity, ...unknown[]]

/**
 * Registry entry for one Plugin id.
 * from: 'bundle' -> re-exported by a Plugin Bundle
 *       'peer'   -> optional peer of the config package, installed by the consumer
 */
interface PluginDefinition {
  from: 'bundle' | 'peer'
  /** ESLint plugin package, plus the parser/processor glue it needs */
  eslint: { plugin: string, parser?: string, processor?: string }
  /** Oxlint realization: built-in scope and/or jsPlugins specifier */
  oxlint?: { builtin?: string, jsPlugin?: string, alias?: string }
}

type PluginRef = ReturnType<typeof pluginRef> // branded string, the Plugin id at runtime

/**
 * A processor, named as the Plugin id that registers it plus the name it registers under: Source
 * cannot hold the processor object itself, so the ESLint Adapter resolves the pair.
 */
interface ProcessorRef {
  plugin: PluginRef
  name: string
  /** Merge the processor with a pass-through, so the document is linted as well as its blocks. */
  passThrough?: boolean
  /** Options for a processor the Bundle builds on demand (Vue's SFC block glue selects blocks). */
  options?: Record<string, unknown>
}

interface ConfigObject {
  /** Public API: 'lumirelle/<upstream tail>', immutable once published */
  name: string
  module: ModuleId
  domain: Domain
  files?: Glob[]
  ignores?: Glob[]
  /** Declares plugin usage; ESLint resolves it to objects, Oxlint derives plugins/jsPlugins */
  plugins?: Partial<Record<PluginId, PluginRef>>
  /** Both tools have an equivalent: ESLint -> languageOptions.globals; Oxlint -> globals */
  globals?: Record<string, boolean>
  rules?: Partial<Record<RuleKey, RuleEntry>>
  /** Root objects only; both tools require settings to be unscoped */
  settings?: Record<string, unknown>
  tools?: {
    eslint?: {
      /** ESLint-only: the language a parser declares (`jsonc/x`, `markdown/gfm`); Oxlint has none */
      language?: string
      /** ESLint-only: the Plugin id whose registered parser becomes `languageOptions.parser` */
      parser?: PluginRef
      languageOptions?: Record<string, unknown>
      linterOptions?: Record<string, unknown>
      /** ESLint-only: the processor that turns a component into lintable scripts */
      processor?: ProcessorRef
    }
    /** false = this object is ESLint-only; the object form carries Oxlint-only fields */
    oxlint?: false | {
      env?: Record<string, boolean>
      jsPlugins?: Array<string | { name: string, specifier: string }>
    }
  }
}

interface Options {
  // Same shape as Upstream; the diff feeds the same object to both sides
  vue?: boolean | { a11y?: boolean, vueVersion?: 2 | 3, sfcBlocks?: boolean }
  react?: boolean
  svelte?: boolean
  astro?: boolean
  solid?: boolean
  angular?: boolean
  nextjs?: boolean
  node?: boolean
  /** The flag, or the Module's rule overrides; `overrides.test` reaches the same rules. */
  test?: boolean | { overrides?: ConfigObject['rules'] }
  jsonc?: boolean
  yaml?: boolean
  toml?: boolean
  markdown?: boolean
  jsdoc?: boolean
  imports?: boolean
  unicorn?: boolean
  perfectionist?: boolean
  pnpm?: boolean | PnpmOptions
  e18e?: boolean
  antislop?: boolean
  sonarjs?: boolean
  regexp?: boolean
  unocss?: boolean
  formatters?: boolean | FormattersOptions
  /** Defaults to false: this project uses oxfmt with objectWrap: preserve */
  stylistic?: boolean | StylisticOptions
  gitignore?: boolean | FlatGitignoreOptions
  type?: 'lib' | 'app'
  typescript?: boolean | { tsconfigPath?: string, erasableOnly?: boolean }
  jsx?: boolean
  componentExts?: string[]
  ignores?: string[]
  /**
   * Whether the factory runs inside an editor integration, where autofixable rules report as
   * warnings; detected from the environment when unset
   */
  isInEditor?: boolean

  // Project-specific extensions
  /**
   * Deep rule/scope merge, equivalent to Upstream's overrides option. A key is either a Module
   * (every object of that Module) or one Config object name, e.g. `lumirelle/typescript/rules`
   */
  overrides?: Partial<Record<ModuleId | `lumirelle/${string}`, Pick<ConfigObject, 'rules' | 'files' | 'ignores'>>>
  /** ESLint-side bridge: turn off rules already handled by Oxlint */
  oxlint?: boolean | OxlintOptions
}

/** The Modules Source emits, in composition order; `src/source.ts` composes them in this order. */
type ModuleId
  = | 'ignores' | 'javascript' | 'typescript' | 'imports' | 'unicorn' | 'node'
    | 'jsdoc' | 'test' | 'jsx' | 'vue' | 'nextjs' | 'react'
    | 'solid' | 'unocss' | 'regexp' | 'perfectionist' | 'e18e' | 'antfu'
    | 'command' | 'eslint-comments' | 'unused-imports' | 'antislop' | 'stylistic' | 'svelte'
    | 'astro' | 'angular' | 'jsonc' | 'yaml' | 'toml' | 'markdown'
    | 'formatters' | 'sort' | 'pnpm' | 'disables'

// The Module option shapes (`FormattersOptions`, `PnpmOptions`, `StylisticOptions`,
// `StylisticIndent`, `OxlintOptions`) are defined in `src/types.ts` next to `Options`.
```

`pluginRef` is a branded string whose runtime value is the Plugin id; the authoritative registry, including whether each id comes from a Bundle or from the consumer, is [`packages/config/src/plugins.ts`](../../packages/config/src/plugins.ts):

```ts
export function pluginRef(id: PluginId): PluginRef
```

## Invariants

1. Every Config object has `name`, `module`, and `domain`.
2. Every `rules` key is prefixed by a registered Plugin id (core rules excepted).
3. Plugins are referenced only through `plugins` + `pluginRef`; Source imports no plugin package.
4. Shared fields must hold for both tools; ESLint-only fields appear only under `tools.eslint`.
5. `settings` appears only on root objects (no `files`).
6. Globs use only `*`, `**`, `{a,b}`, and character classes.
7. Config object order inside a Module is override order; both Adapters must preserve it.
8. The Bridge is computed from Source's Config objects, never by parsing Oxlint's output.
9. A Module whose Plugin ids are `from: 'peer'` only runs when the consumer installed those packages; otherwise it fails with an error naming them.

## Module coverage

The Modules as implemented, with the Oxlint realization each Plugin id records. What an Emission cannot emit is not listed here but derived: the committed [`coverage.json`](../../packages/config/coverage.json) is the per-Module answer for the current Oxlint inventory.

| Module | Domain | ESLint plugin source | Oxlint |
| --- | --- | --- | --- |
| `ignores` | js | — | `ignorePatterns` |
| `javascript` | js | core | built-in `eslint` |
| `typescript` | js | bundle (`@typescript-eslint`) | built-in `typescript`, type-aware rules excluded |
| `imports` | js | bundle (`eslint-plugin-import-lite`) | built-in `import` |
| `unicorn` | js | bundle | built-in `unicorn` |
| `node` | js | bundle (`eslint-plugin-n`) | built-in `node` |
| `jsdoc` | js | bundle | built-in `jsdoc` |
| `test` | js | bundle (`@vitest/eslint-plugin`) | built-in `vitest` |
| `jsx` | js | parser/settings only | built-in `react` / `jsx-a11y` (partial) |
| `vue` | vue | bundle + peer (`eslint-plugin-vuejs-accessibility` for a11y) | built-in `vue` |
| `nextjs` | js | peer (`@next/eslint-plugin-next`) | built-in `nextjs` |
| `react` | js | peer (`@eslint-react/eslint-plugin`) | built-in `react` |
| `solid` | js | peer (`eslint-plugin-solid`) | `jsPlugins` (load test required) |
| `unocss` | js | peer (`@unocss/eslint-plugin`) | `jsPlugins` (load test required) |
| `regexp` | js | bundle (`eslint-plugin-regexp`) | `jsPlugins` (conformance-tested) |
| `perfectionist` | js | bundle | `jsPlugins` |
| `e18e` | js | bundle (`@e18e/eslint-plugin`) | `jsPlugins` (conformance-tested) |
| `antfu` | js | bundle | `jsPlugins` |
| `command` | js | bundle | `jsPlugins` |
| `eslint-comments` | js | bundle | ESLint only: blacklisted for Oxlint (`no-unlimited-disable` crashes the report shim) |
| `unused-imports` | js | bundle | `jsPlugins` |
| `antislop` | js | peer (`eslint-plugin-slop`, `eslint-plugin-sonarjs`) | `jsPlugins` for both, load-tested against Oxlint |
| `stylistic` | js | bundle | `jsPlugins`, disabled by default |
| `svelte` / `astro` / `angular` | svelte / astro / angular | peer | unsupported |
| `jsonc` / `yaml` / `toml` | data | bundle | unsupported (no parser) |
| `markdown` | markup | bundle (`@eslint/markdown`) | unsupported (no processor) |
| `formatters` | data / markup | peer (`eslint-plugin-format`) | unsupported |
| `sort` | data | bundle (`eslint-plugin-jsonc`) | unsupported |
| `pnpm` | data | bundle (`eslint-plugin-pnpm`) | unsupported |
| `disables` | js | — | built-in, trimmed by the Coverage report |

## Adapter algorithms

**ESLint**

1. `source(options)` -> `ConfigObject[]`
2. Filter `domain ∈ {js, vue, svelte, astro, angular, data, markup}`
3. Resolve each `plugins` entry through the registry: `bundle` -> Bundle object, `peer` -> consumer's copy;
   resolve `tools.eslint.parser` the same way into `languageOptions.parser`
4. `globals` -> `languageOptions.globals`
5. Merge `tools.eslint`
6. `new FlatConfigComposer(configs)`; when `options.oxlint` is set, append the Bridge

**Oxlint**

1. `source(options)` -> `ConfigObject[]`
2. Filter `domain ∈ {js, vue}` and `tools.oxlint !== false`
3. Drop `plugins`, `languageOptions`, `linterOptions`, `processor`
4. Map rule keys: Plugin id -> built-in scope or jsPlugin alias. For built-ins, emit only if the rule exists in the inventory; for jsPlugin-capable ids, register `jsPlugins` and emit; otherwise drop and record in the Coverage report
5. Reject `!` inside scoped `ignores` (fast-glob cannot express it)
6. Inject root `options.typeAware` / `typeCheck`, then hand over to the composer

**Bridge**

For every Config object, take the rules Oxlint can implement and emit `off` entries with the same `files` / `ignores`, preserving order, appended last. `oxlintBridge()` is exported so consumers can re-append it after their own configs.

## Decisions

1. Source lives in `src/modules/<module>.ts`; `src/source.ts` only composes them. `src/globs.ts`, `src/plugins.ts` (registry), `src/adapters/{eslint,oxlint}.ts`, `src/oxlint/{inventory,rule-map,report}.ts`, `src/bridge.ts`; the committed Oxlint Coverage report is [`packages/config/coverage.json`](../../packages/config/coverage.json).
2. `jsPlugins` aliases always equal the Plugin id; a test forbids collisions with the reserved names.
3. `domain` is required; Adapters filter on it instead of guessing from globs.
4. v1 ports `formatters` / `sort` / `pnpm` but keeps them disabled by default; they have no Oxlint realization.
5. Plugin Bundles forward only Upstream's regular lint dependencies. Upstream's optional peers (language and framework plugins, parsers, formatters) remain optional peers of the config package and are installed by the consumer; the registry records this as `from: 'peer'`.
6. Both factories return Composers and are exported directly. Oxlint awaits the default export before validating it, so `export default oxlint()` needs no top-level `await`, same as ESLint. Oxlint-style array exports are not an option on the Oxlint side (the loader rejects non-object defaults); consumers compose with `extends` / `append`.
