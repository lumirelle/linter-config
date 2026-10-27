# @lumirelle/linter-plugins-oxlint

Oxlint plugin data for `@lumirelle/linter-config`.

This bundle only forwards package names: it lists the Oxlint built-in plugins the config may enable and
the `jsPlugins` specifiers that fill the gaps, and it contains no rule semantics of its own. Every rule,
severity and file scope comes from the config package, so a rule change never lands here.

`@lumirelle/linter-config`, `@lumirelle/linter-plugins-eslint` and `@lumirelle/linter-plugins-oxlint` are
released in lockstep: a plugin upgrade bumps this bundle and both other packages together, so their
versions always match and there is no "which bundle goes with which config" question.

This bundle is an optional peer of the config package. A project that only runs ESLint installs
`@lumirelle/linter-plugins-eslint` instead.

## What Oxlint runs on its own

Most of the plugins `@antfu/eslint-config` bundles already have a native implementation in Oxlint, so
they need no package from this bundle and none from your project. The config enables them through
Oxlint's own scopes, and because a scope name and a Plugin id are the same string, a rule key reads
identically in both tools:

| Plugin id   | Oxlint scope |
| ----------- | ------------ |
| `import`    | `import`     |
| `jsdoc`     | `jsdoc`      |
| `jsx-a11y`  | `jsx-a11y`   |
| `next`      | `nextjs`     |
| `node`      | `node`       |
| `react`     | `react`      |
| `test`      | `vitest`     |
| `ts`        | `typescript` |
| `unicorn`   | `unicorn`    |
| `vue`       | `vue`        |

Native is not the same as complete. Oxlint implements a subset of each plugin's rules, and the ones it
does not implement are recorded per Module in the [Coverage report](../config/coverage.json) with the
reason — `unknown-rule`, `type-aware`, `no-oxlint-realization` — rather than dropped silently. That is
why the ESLint and Oxlint Emissions of the same options differ, and why the Bridge exists.

## What Oxlint cannot run yet

A plugin that needs its own parser cannot run at all. Oxlint lists "custom file formats and parsers
(e.g. Svelte, Vue, Angular)" as **not supported yet**, so `eslint-plugin-svelte`, `eslint-plugin-astro`,
`@angular-eslint/*`, `eslint-plugin-format` and the processor-backed `jsonc`, `yaml`, `toml` and
`markdown` Modules are ESLint-only here. See the
[JS Plugins documentation](https://oxc.rs/docs/guide/usage/linter/js-plugins) and
[Oxlint JS Plugins Milestone 3](https://github.com/oxc-project/oxc/issues/19918), which tracks the
remaining plugin API surface.

Four more have no Oxlint equivalent at all and are ESLint-only for that reason:
`eslint-plugin-react-refresh`, `eslint-plugin-vuejs-accessibility`, `eslint-plugin-pnpm` and
`eslint-plugin-erasable-syntax-only`. The Coverage report is the authoritative list, and it moves with
the Oxlint version this repository pins.

## What it runs through `jsPlugins`, and why you install those yourself

The remaining plugins are real ESLint plugins that Oxlint loads as JS plugins. They work, but Oxlint has
to find them, and it resolves a `jsPlugins` entry **relative to the config file itself** — that is,
inside your project's `node_modules`. The entry is a module specifier, not a path into this bundle, so
this bundle cannot bring the plugin with it.

The packages behind the Modules you enable therefore have to be direct dependencies of your project,
exactly as they would be for ESLint:

- the default Modules: `eslint-plugin-antfu`, `eslint-plugin-command`, `@e18e/eslint-plugin`,
  `eslint-plugin-perfectionist`, `eslint-plugin-regexp` and `eslint-plugin-unused-imports`;
- with the `stylistic` Module on: `@stylistic/eslint-plugin`;
- for the Modules whose plugins are optional peers: `eslint-plugin-slop`, `eslint-plugin-solid`,
  `eslint-plugin-sonarjs`, `@unocss/eslint-plugin`.

One plugin is missing from that list on purpose: `eslint-comments` is always composed as a Module, but
its rules never reach the Oxlint Emission. Its `no-unlimited-disable` rule throws out of Oxlint's report
shim on a block `/* eslint-disable */` directive, so the config package blacklists the plugin and records
its rules as `blacklisted-plugin` in the Coverage report — a plugin that works on one file and fails on
another would make the same alias mean different things depending on what is linted.

That limitation is why this bundle declares no dependencies of its own: it holds the list, and the
config package names the packages to install when a Module is enabled without them. `jsPlugins` is
alpha and outside semver, so a plugin can change behaviour between Oxlint releases even when this
package does not.

## Workaround: resolving a plugin from another package

A `jsPlugins` entry also accepts an object with an explicit `specifier`, and any specifier that resolves
is loaded. A package that owns the dependency can therefore hand Oxlint an absolute path resolved from
its own module graph, which turns the plugin into a dependency of that package instead of a dependency
of every consumer:

```ts
// oxlint.config.ts, inside a package that depends on the plugin
import { createRequire } from 'node:module'
import { defineConfig } from 'oxlint'

const require = createRequire(import.meta.url)

export default defineConfig({
  jsPlugins: [
    { name: 'perfectionist', specifier: require.resolve('eslint-plugin-perfectionist') },
  ],
  rules: { 'perfectionist/sort-objects': 'error' },
})
```

Verified against the Oxlint version this repository pins: the rule reports normally, where the plain
package name fails in a project that does not depend on the plugin itself.

It is not applied here yet. It would give the installation parity worth having — install this bundle,
get the plugins — but it also puts machine-specific absolute paths into the Emission, the artifact
`mise run play` prints and `mise run upstream:diff` compares, and it leans on `jsPlugins` behaviour that
is still alpha. When it lands it will be an opt-in the config package sets, not a new default.

## Usage

Consumers do not import this package; the config package resolves it:

```ts
// oxlint.config.ts
import { oxlint } from '@lumirelle/linter-config/oxlint'

export default oxlint()
```

## License

[MIT](../../LICENSE.md) License © [Lumirelle](https://github.com/lumirelle)
