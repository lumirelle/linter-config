# @lumirelle/linter-config

[![npm version][npm-version-src]][npm-version-href]
[![npm downloads][npm-downloads-src]][npm-downloads-href]
[![bundle][bundle-src]][bundle-href]
[![JSDocs][jsdocs-src]][jsdocs-href]
[![Codecov][codecov-src]][codecov-href]
[![License][license-src]][license-href]

Lumirelle's opinionated linter config: one set of preferences, emitted for ESLint and for Oxlint.

## Install

```sh
nub add -D @lumirelle/linter-config
# Or PNPM
pnpm add -D @lumirelle/linter-config
# Or NPM
npm install -D @lumirelle/linter-config
```

The default plugins setup for different linter are optional peers, pick as your need:

- `@lumirelle/linter-plugins-eslint`: If you want to use `@lumirelle/linter-config/eslint`.
- `@lumirelle/linter-plugins-oxlint`: If you want to use `@lumirelle/linter-config/oxlint`.

If you want to use some optional options, such as `eslint({ react: true })`, you may need to install the corresponding plugin.

> [!NOTE]
> Oxlint runs most of these plugins natively. One that needs its own parser cannot run through
> `jsPlugins` yet — Svelte, Astro, Angular, `format` and the `jsonc`/`yaml`/`toml`/`markdown` Modules
> stay ESLint-only ([docs][oxlint-js-plugins], [Milestone 3][oxlint-js-plugins-milestone]). The rest are
> `jsPlugins` specifiers Oxlint resolves against your config file, so you install them yourself. The
> [bundle README][plugins-oxlint] lists them and records the workaround — an absolute `require.resolve`
> specifier resolved from the package that owns the plugin — which we plan to offer in a later version so
> this bundle can ship the plugins instead of you. The [Coverage report][coverage] has the rules still
> missing.

## ESLint

```js
// eslint.config.js
import { eslint } from '@lumirelle/linter-config/eslint'

export default eslint({
  // Type-aware rules need the project's TypeScript config.
  typescript: { tsconfigPath: 'tsconfig.json' },
})
```

## OxLint

```ts
// oxlint.config.ts
import { oxlint } from '@lumirelle/linter-config/oxlint'

export default oxlint({
  // Type-aware rules need the project's TypeScript config.
  typescript: { tsconfigPath: 'tsconfig.json' },
})
```

## Composition and overrides

Both composers of ESLint and OxLint support `append`, `override`, `insertAfter` and `remove`.

For ESLint, it uses [`eslint-flat-config-utils`](https://github.com/antfu/eslint-flat-config-utils) under the hood; for OxLint, it uses [`@oxlint-flat-config/composer`](https://github.com/liangmiQwQ/oxlint-flat-config/tree/main/packages/composer) under the hood.

A Config object is addressed by its stable `name`, `lumirelle/<upstream tail>`:

> [!Note]
> Only the ESLint side has the Bridge: `oxlint: true` (or its object form) turns off the rules of ESLint which is already handled by OxLint.
>
> That option alone enables it, and it always resolves last: the factory owns its position, after every Config object you append, insert or override.
>
> They are designed for mixed use, because of OxLint does not support custom language parser yet.

```js
// eslint.config.js
import { eslint } from '@lumirelle/linter-config/eslint'

const options = { oxlint: { typeAware: true } }

export default eslint(options)
  // One named Config object, without restating the Module.
  .override('lumirelle/javascript/rules', { rules: { 'no-console': 'off' } })
  // Your own objects are appended after ours and resolve before the Bridge, which the factory appends last.
  .append({ name: 'project/no-legacy', files: ['legacy/**'], rules: { 'ts/no-explicit-any': 'error' } })
```

Or by its Module for the factory's own `overrides` option:

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

For more usage details, please refer to below two composer package:
- [`eslint-flat-config-utils`](https://github.com/antfu/eslint-flat-config-utils)
- [`@oxlint-flat-config/composer`](https://github.com/liangmiQwQ/oxlint-flat-config/tree/main/packages/composer)

## Examples

[`playground/`][playground] holds seven example projects:

- A Next.js application
- A Nuxt application
- A React single-page application
- A Vue single-page application
- A TypeScript library
- A TypeScript monorepo
- A browser extension

You can run `mise run play {example_id}` to see the emissions for each example:

```sh
mise run play ts     # Print both Emissions for one example
mise run play --all  # Print for every example
```

See the [playground index][playground] for the table of examples and the options each one demonstrates.

## Coverage report and upstream comparison

This configuration is highly inspired by the upstream package [`@antfu/eslint-config`](https://github.com/antfu/eslint-config). It introduces a mechanism to compare with upstream.

- The Coverage report includes the rules the Oxlint Emission cannot implement, per Module, with the reason, which is committed at [`packages/config/coverage.json`][coverage] and guarded by a snapshot test.
- The Upstream comparison is rendered by `mise run upstream:diff`, which writes `reports/upstream-diff.md`; `mise run upstream:check` fails only when the pinned submodule tag and the installed `@antfu/eslint-config` version disagree.
- The repository dogfoods both subpaths in [`eslint.config.js`][dogfood-eslint] and [`oxlint.config.ts`][dogfood-oxlint].

## Thanks To

- [`eslint-flat-config-utils`](https://github.com/antfu/eslint-flat-config-utils): ESLint composer API support.
- [`@oxlint-flat-config/composer`](https://github.com/liangmiQwQ/oxlint-flat-config/tree/main/packages/composer): OxLint composer API support.
- [`@antfu/eslint-config`](https://github.com/antfu/eslint-config): ESLint & OxLint config source reference.

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

[playground]: https://github.com/lumirelle/linter-config/blob/main/playground/README.md
[coverage]: https://github.com/lumirelle/linter-config/blob/main/packages/config/coverage.json
[dogfood-eslint]: https://github.com/lumirelle/linter-config/blob/main/eslint.config.js
[dogfood-oxlint]: https://github.com/lumirelle/linter-config/blob/main/oxlint.config.ts
[plugins-oxlint]: https://github.com/lumirelle/linter-config/blob/main/packages/plugins-oxlint/README.md
[oxlint-js-plugins]: https://oxc.rs/docs/guide/usage/linter/js-plugins
[oxlint-js-plugins-milestone]: https://github.com/oxc-project/oxc/issues/19918
