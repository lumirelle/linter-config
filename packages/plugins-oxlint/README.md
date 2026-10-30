# @lumirelle/linter-plugins-oxlint

Oxlint plugin list for `@lumirelle/linter-config`.

This bundle lists the Oxlint built-in plugins and the `jsPlugins` specifiers the config may enable. It
ships the packages behind the specifiers it resolves and contains no rule semantics of its own: every
rule, severity and file scope comes from the config package.

This bundle is an optional peer of the config package. A project that only runs ESLint should install
`@lumirelle/linter-plugins-eslint` instead.

## Usage

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

## What Oxlint runs on its own

Most of the plugins the config uses already have a native implementation in Oxlint, so they need no
package from this bundle and none from your project. The config enables them through Oxlint's own
scopes:

| Plugin id  | Oxlint scope |
| ---------- | ------------ |
| `import`   | `import`     |
| `jsdoc`    | `jsdoc`      |
| `jsx-a11y` | `jsx-a11y`   |
| `next`     | `nextjs`     |
| `node`     | `node`       |
| `react`    | `react`      |
| `test`     | `vitest`     |
| `ts`       | `typescript` |
| `unicorn`  | `unicorn`    |
| `vue`      | `vue`        |

The native plugins are not the same as their ESLint counterparts. Oxlint implements a subset of each
plugin's rules, and the [Coverage report](../config/coverage.json) records the rest per Module with
the reason. That is why the ESLint and Oxlint Emissions of one options object differ, and why the
Bridge exists when you run both tools.

## What Oxlint cannot run yet

A plugin that needs its own parser cannot run at all. Oxlint lists "custom file formats and parsers
(e.g. Svelte, Vue, Angular)" as not supported yet, so these are ESLint-only here:
`eslint-plugin-svelte`, `eslint-plugin-astro`, `@angular-eslint/*`, `eslint-plugin-react-refresh`,
`eslint-plugin-vuejs-accessibility`, `eslint-plugin-pnpm`, `eslint-plugin-erasable-syntax-only`,
`eslint-plugin-format`, and the processor-backed `jsonc`, `yaml`, `toml` and `markdown` Modules. See
the [JS Plugins documentation](https://oxc.rs/docs/guide/usage/linter/js-plugins) and
[Oxlint JS Plugins Milestone 3](https://github.com/oxc-project/oxc/issues/19918), which tracks the
remaining plugin API surface.

`eslint-comments` does not work with Oxlint: it reports `column: -1`, which Oxlint rejects, so the
Coverage report marks it `blacklisted-plugin`. The report holds the complete list of what does not
run.

## What it runs through `jsPlugins`

The remaining plugins are real ESLint plugins that Oxlint loads as JS plugins. This Bundle ships the
packages behind the Plugin ids the default Modules load, and resolves each one to an absolute path
while your config loads, so you install the Bundle and nothing else for those.

Packages `@antfu/eslint-config` declares as optional peers stay yours to install, and a Module that
needs a missing one names it: `eslint-plugin-slop`, `eslint-plugin-solid`, `eslint-plugin-sonarjs`,
`@unocss/eslint-plugin`, and `@stylistic/eslint-plugin` when you turn `stylistic` on.

## License

[MIT](../../LICENSE.md) License © [Lumirelle](https://github.com/lumirelle)
