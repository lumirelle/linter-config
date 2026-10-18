# @lumirelle/linter-config

[![npm version][npm-version-src]][npm-version-href]
[![npm downloads][npm-downloads-src]][npm-downloads-href]
[![bundle][bundle-src]][bundle-href]
[![JSDocs][jsdocs-src]][jsdocs-href]
[![Codecov][codecov-src]][codecov-href]
[![License][license-src]][license-href]

Lumirelle's opinionated linter config: one set of preferences, emitted for ESLint and for Oxlint.

One hand-written Source produces two Emissions. `@lumirelle/linter-config/eslint` returns an `eslint-flat-config-utils` composer, `@lumirelle/linter-config/oxlint` returns an `oxlint-flat-config` composer, and the same options object configures both, so the two tools cannot drift by configuration. Both factories are thenable: neither config file needs a top-level `await`.

The vocabulary (Source, Config object, Module, Emission, Plugin Bundle, Bridge, Coverage report) is defined in [GLOSSARY.md][glossary]; the decisions behind the shape are [ADR 0001][adr-1] and [ADR 0002][adr-2], and the field-level reference is [docs/design/source-schema.md][schema].

## Install

```sh
npm install -D @lumirelle/linter-config
```

The plugins are optional peers, so a project only installs the ones its Modules use:

- `@lumirelle/linter-plugins-eslint` forwards the ESLint plugin objects Source references by Plugin id. It is needed by `@lumirelle/linter-config/eslint` only.
- `@lumirelle/linter-plugins-oxlint` carries the `jsPlugins` specifiers and the built-in plugin list. It is needed by `@lumirelle/linter-config/oxlint` only.
- The packages Upstream treats as optional peers (framework and language plugins, parsers, formatters) stay yours to install; enabling a Module without them throws an error naming every missing package.
- Oxlint resolves a `jsPlugins` specifier from the config file's directory, never from this package's `node_modules`, so those plugins must be among your own dependencies.

The three packages are released in lockstep, so their versions always match.

## ESLint

```js
// eslint.config.js
import { eslint } from '@lumirelle/linter-config/eslint'

export default eslint({
  // Type-aware rules need the project's TypeScript config.
  typescript: { tsconfigPath: 'tsconfig.json' },
})
```

The `stylistic` Module is off by default: this config is meant to be paired with `oxfmt` (`objectWrap: 'preserve'`), and `@stylistic` would rewrap object literals the formatter keeps. Turn it on with `stylistic: true` when formatting-as-lint is what you want.

`jsonc`, `yaml`, `toml`, `markdown` and — unless `oxlint: { typeAware: true }` is set — every type-aware rule are ESLint-only, because Oxlint can add neither a parser nor a processor and reads type information only in its own type-aware mode.

## Oxlint

```ts
// oxlint.config.ts
import { oxlint } from '@lumirelle/linter-config/oxlint'

export default oxlint({
  typescript: { tsconfigPath: 'tsconfig.json' },
})
```

Oxlint discovers `oxlint.config.ts` without a `-c` flag. Do not keep an `.oxlintrc.json` beside it: Oxlint refuses to load when both config files exist in one directory. Oxlint's `jsPlugins` are alpha and outside semver, so a JS plugin can change behaviour between Oxlint releases even when this config does not.

## Composition and overrides

Both composers support `append`, `override`, `insertAfter` and `remove`. A Config object is addressed by its stable `name`, `lumirelle/<upstream tail>`, or by its Module for the factory's own `overrides` option.

```js
// eslint.config.js
import { eslint, oxlintBridge } from '@lumirelle/linter-config/eslint'

const options = { oxlint: { typeAware: true } }

export default eslint(options)
  // One named Config object, without restating the Module.
  .override('lumirelle/javascript/rules', { rules: { 'no-console': 'off' } })
  // Your own objects are appended after ours.
  .append({ name: 'project/no-legacy', files: ['legacy/**'], rules: { 'ts/no-explicit-any': 'error' } })
  // The Bridge goes last, so a rule you re-enabled is turned off again where Oxlint reports it.
  .append(...oxlintBridge(options))
```

The same overrides through the factory, which keeps them in one object for both tools:

```js
eslint({
  overrides: {
    // A Module: the rules merge into every Config object of that Module.
    javascript: { rules: { 'no-console': 'off' } },
    // One Config object.
    'lumirelle/typescript/rules': { rules: { 'ts/no-explicit-any': 'error' } },
  },
})
```

`oxlint()` takes the same `overrides` keys, so a Module-level override lands in both Emissions. Only the ESLint side has the Bridge: `oxlint: true` (or its object form) appends it, and [`oxlintBridge()`][bridge] is exported so you can re-append it after appending your own configs.

## Examples

[`playground/`][playground] holds private example workspaces, one per kind of project this config is meant for — a TypeScript library today. Each example keeps one options module that both its ESLint and Oxlint configs read, and its README maps the project's previous configuration onto that module, so a migration is a diff rather than a guess.

```sh
mise run play ts     # print both Emissions for one example
mise run play --all  # print every example
```

See the [playground index][playground] for the list, or [`playground/ts`][example-ts] for the first one.

## Coverage report and upstream comparison

- The Coverage report — the rules the Oxlint Emission cannot implement, per Module, with the reason — is committed at [`packages/config/coverage.json`][coverage] and guarded by a snapshot test.
- The Upstream comparison is rendered by `mise run upstream:diff`, which writes `reports/upstream-diff.md`; `mise run upstream:check` fails only when the pinned submodule tag and the installed `@antfu/eslint-config` version disagree.
- The repository dogfoods both subpaths in [`eslint.config.js`][dogfood-eslint] and [`oxlint.config.ts`][dogfood-oxlint].

## Sponsors

<p align="center">
  <a href="https://cdn.jsdelivr.net/gh/lumirelle/static/sponsors.svg">
    <img src='https://cdn.jsdelivr.net/gh/lumirelle/static/sponsors.svg' alt="Sponsors"/>
  </a>
</p>

## License

[MIT][license-href] License © [Lumirelle](https://github.com/lumirelle)

<!-- Badges -->

[npm-version-src]: https://img.shields.io/npm/v/@lumirelle/linter-config?style=flat&colorA=18181B&colorB=F0DB4F
[npm-version-href]: https://npmjs.com/package/@lumirelle/linter-config
[npm-downloads-src]: https://img.shields.io/npm/dm/@lumirelle/linter-config?style=flat&colorA=18181B&colorB=F0DB4F
[npm-downloads-href]: https://npmjs.com/package/@lumirelle/linter-config
[bundle-src]: https://img.shields.io/bundlephobia/minzip/@lumirelle/linter-config?style=flat&colorA=18181B&colorB=F0DB4F&label=minzip
[bundle-href]: https://bundlephobia.com/result?p=@lumirelle/linter-config
[jsdocs-src]: https://img.shields.io/badge/jsdocs-reference-080f12?style=flat&colorA=18181B&colorB=F0DB4F
[jsdocs-href]: https://www.jsdocs.io/package/@lumirelle/linter-config
[codecov-src]: https://img.shields.io/codecov/c/gh/lumirelle/linter-config/main?style=flat&colorA=18181B&colorB=F0DB4F
[codecov-href]: https://codecov.io/gh/lumirelle/linter-config
[license-src]: https://img.shields.io/github/license/lumirelle/linter-config.svg?style=flat&colorA=18181B&colorB=F0DB4F
[license-href]: https://github.com/lumirelle/linter-config/blob/main/LICENSE.md

<!-- Repository links: absolute, so this README resolves from both the repository root and packages/config/ -->

[glossary]: https://github.com/lumirelle/linter-config/blob/main/GLOSSARY.md
[adr-1]: https://github.com/lumirelle/linter-config/blob/main/docs/adr/0001-source-and-composers.md
[adr-2]: https://github.com/lumirelle/linter-config/blob/main/docs/adr/0002-plugin-bundles.md
[schema]: https://github.com/lumirelle/linter-config/blob/main/docs/design/source-schema.md
[bridge]: https://github.com/lumirelle/linter-config/blob/main/packages/config/src/bridge.ts
[playground]: https://github.com/lumirelle/linter-config/blob/main/playground/README.md
[example-ts]: https://github.com/lumirelle/linter-config/blob/main/playground/ts/README.md
[coverage]: https://github.com/lumirelle/linter-config/blob/main/packages/config/coverage.json
[dogfood-eslint]: https://github.com/lumirelle/linter-config/blob/main/eslint.config.js
[dogfood-oxlint]: https://github.com/lumirelle/linter-config/blob/main/oxlint.config.ts
