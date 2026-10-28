# @lumirelle/linter-plugins-oxlint

Oxlint plugin list for `@lumirelle/linter-config`.

This bundle only forwards package names: it lists the Oxlint built-in plugins and the `jsPlugins` specifiers the config
may enable, and it contains no rule semantics of its own. Every rule, severity and file scope comes from the config
package.

This bundle is an optional peer of the config package. A project that only runs ESLint should install
`@lumirelle/linter-plugins-eslint` instead.

## Usage

> [!Note]
> This package does not include any plugin dependencies yet; install the ones the enabled Modules need.
>
> Please refer to [section below](#what-it-runs-through-jsplugins-and-why-you-install-those-yourself) for the dependencies list you should install manually.

Install this package and use this with `@lumirelle/linter-config/oxlint`:

```nu
nub add @lumirelle/linter-plugins-oxlint -D
# Or PNPM
pnpm add @lumirelle/linter-plugins-oxlint -D
# Or NPM
npm install @lumirelle/linter-plugins-oxlint -D
```

```ts
// oxlint.config.ts
import { oxlint } from '@lumirelle/linter-config/oxlint'

export default oxlint()
```

## What Oxlint Runs on Its Own

Most of the plugins the config package used already have a native implementation in Oxlint, so
they need no package from this bundle and none from your project. The config enables them through
Oxlint's own scopes:

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

But notice, those native plugins are not the same as correspoding ESLint plugins: Oxlint implements a subset of each
plugin's rules, and the rules it does not implement are recorded per Module in the
[Coverage report](../config/coverage.json) with the reason. That is why the ESLint and Oxlint Emissions of the same
options differ, and why the Bridge exists when you use them together.

## What Oxlint Cannot Run Yet

A plugin that needs its own parser cannot run at all. Oxlint lists "custom file formats and parsers
(e.g. Svelte, Vue, Angular)" as **not supported yet**, so `eslint-plugin-svelte`, `eslint-plugin-astro`,
`@angular-eslint/*`, `eslint-plugin-react-refresh`, `eslint-plugin-vuejs-accessibility`, `eslint-plugin-pnpm` and
`eslint-plugin-erasable-syntax-only`, `eslint-plugin-format` and the processor-backed `jsonc`, `yaml`, `toml` and
`markdown` Modules are ESLint-only here. See the
[JS Plugins documentation](https://oxc.rs/docs/guide/usage/linter/js-plugins) and
[Oxlint JS Plugins Milestone 3](https://github.com/oxc-project/oxc/issues/19918), which tracks the
remaining plugin API surface.

`eslint-comments` is not compatible with Oxlint now, it uses `column: -1` which is not allowed in Oxlint, so it's marked as `blacklisted-plugin` in the Coverage report.

The Coverage report will show the complete list to you.

## What It Runs Through `jsPlugins`, and Why You Install Those Yourself

The remaining plugins are real ESLint plugins that Oxlint loads as JS plugins. They work, but Oxlint has
to find them, and it resolves a `jsPlugins` entry from the `node_modules` **relative to the config file itself**,
that is the `node_modules` in your project root. The entry is a module specifier, not a plugin object, so
this bundle cannot works in the same way of `@lumirelle/linter-plugins-eslint`.

The packages behind the Modules you enable therefore have to be direct dependencies of your project:

- The default Modules: `eslint-plugin-antfu`, `eslint-plugin-command`, `@e18e/eslint-plugin`,
  `eslint-plugin-perfectionist`, `eslint-plugin-regexp` and `eslint-plugin-unused-imports`.
- With the `stylistic` Module on: `@stylistic/eslint-plugin`.
- For the Modules whose plugins are optional peers in the Upstream: `eslint-plugin-slop`, `eslint-plugin-solid`,
  `eslint-plugin-sonarjs`, `@unocss/eslint-plugin`.

## Workaround: Resolving a Plugin from Another Package

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

Not applied here yet: it would move the plugin dependency into this bundle, but it also puts
machine-specific absolute paths into the Emission: the artifact `mise run play` prints and
`mise run upstream:diff` compares.



## License

[MIT](../../LICENSE.md) License © [Lumirelle](https://github.com/lumirelle)
