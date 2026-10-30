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

The default plugin set for each linter is an optional peer. Install the one your linter needs:

- `@lumirelle/linter-plugins-eslint` for `@lumirelle/linter-config/eslint`
- `@lumirelle/linter-plugins-oxlint` for `@lumirelle/linter-config/oxlint`

Some options need a plugin the Bundles do not ship. For example, with `eslint({ react: true })`, you should install
`@eslint-react/eslint-plugin` in your own project.

> [!NOTE]
> Oxlint runs most of the required plugins natively. Some plugins need their own parser, so they cannot run through
> `jsPlugins` and have no native implementation: Svelte, Astro, Angular, `format` and the
> `jsonc`/`yaml`/`toml`/`markdown` Modules stay ESLint-only ([docs][oxlint-js-plugins],
> [Milestone 3][oxlint-js-plugins-milestone]).
>
> The [Coverage report][coverage] lists the rules Oxlint still does not support.

## ESLint

```js
// eslint.config.js
import { eslint } from '@lumirelle/linter-config/eslint'

export default eslint({
  // Type-aware rules need the project's TypeScript config.
  typescript: { tsconfigPath: 'tsconfig.json' },
})
```

## Oxlint

```ts
// oxlint.config.ts
import { oxlint } from '@lumirelle/linter-config/oxlint'

export default oxlint({
  // Type-aware rules need the project's TypeScript config.
  typescript: { tsconfigPath: 'tsconfig.json' },
})
```

## Composition and overrides

The composers on both sides support `append`, `override`, `insertAfter` and `remove`. The ESLint side
is [`eslint-flat-config-utils`](https://github.com/antfu/eslint-flat-config-utils); the Oxlint side is
[`@oxlint-flat-config/composer`](https://github.com/liangmiQwQ/oxlint-flat-config/tree/main/packages/composer).

A Config object is addressed by its stable `name`, of the form `lumirelle/{upstream_tail}`.

> [!Note]
> Only the ESLint side has the Bridge. `oxlint: true`, or its object form, turns off the ESLint rules that Oxlint
> already reports.
>
> That option alone enables the Bridge, and it reaches the rules the `eslint()` factory creates plus every Config object
> you append, insert or override.
>
> The Bridge exists for mixed use.

```js
// eslint.config.js
import { eslint } from '@lumirelle/linter-config/eslint'

const options = { oxlint: { typeAware: true } }

export default eslint(options)
  // One named Config object, without restating the Module.
  .override('lumirelle/javascript/rules', { rules: { 'no-console': 'off' } })
  // Your own objects resolve before the Bridge, which the factory adds at resolution time.
  .append({
    name: 'project/no-legacy',
    files: ['legacy/**'],
    rules: { 'ts/no-explicit-any': 'error' },
  })
```

Or by its Module, for the factory's own `overrides` option:

```js
eslint({
  overrides: {
    // A Module: the rules merge into every Config object of that Module.
    'javascript': { rules: { 'no-console': 'off' } },
    // One Config object.
    'lumirelle/typescript/rules': { rules: { 'ts/no-explicit-any': 'error' } },
  },
})
```

For more usage details, please refer to below two composer package:

- [`eslint-flat-config-utils`](https://github.com/antfu/eslint-flat-config-utils)
- [`@oxlint-flat-config/composer`](https://github.com/liangmiQwQ/oxlint-flat-config/tree/main/packages/composer)

## Examples

[`playground/`][playground] holds 21 examples: seven stacks, each shipped in an
ESLint-only, an Oxlint-only and a paired flavor and named `<flavor>/<stack>`:

- A Next.js application
- A Nuxt application
- A React single-page application
- A Vue single-page application
- A TypeScript library
- A TypeScript monorepo
- A browser extension

You can run `mise run play {name}` to see the emissions: a stack name prints all three flavors of
that stack, and a flavor-qualified name prints one.

```sh
mise run play ts         # All three flavors of one stack
mise run play eslint/ts  # One flavor of it
mise run play --all      # Print every example
```

See the [playground index][playground] for the Flavor × Stack matrix and the project each stack
simulates.

## Coverage report and upstream comparison

This configuration is highly inspired by the upstream package [`@antfu/eslint-config`](https://github.com/antfu/eslint-config). It introduces a mechanism to compare with upstream.

- The Coverage report lists, per Module, the rules the Oxlint Emission cannot implement and why. It is committed at [`packages/config/coverage.json`][coverage] and a snapshot test guards it.
- The Upstream comparison is rendered by `mise run upstream:diff`, which writes `reports/upstream-diff.md`. `mise run upstream:check` fails only when the pinned submodule tag and the installed `@antfu/eslint-config` version disagree.
- This repository runs both subpaths on itself, in [`eslint.config.js`][dogfood-eslint] and [`oxlint.config.ts`][dogfood-oxlint].

## Credits

- [`eslint-flat-config-utils`](https://github.com/antfu/eslint-flat-config-utils): ESLint composer API.
- [`@oxlint-flat-config/composer`](https://github.com/liangmiQwQ/oxlint-flat-config/tree/main/packages/composer): Oxlint composer API.
- [`@antfu/eslint-config`](https://github.com/antfu/eslint-config): the upstream this config compares against.

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
[oxlint-js-plugins]: https://oxc.rs/docs/guide/usage/linter/js-plugins
[oxlint-js-plugins-milestone]: https://github.com/oxc-project/oxc/issues/19918
