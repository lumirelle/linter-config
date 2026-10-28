# @lumirelle/linter-plugins-oxlint

Oxlint plugin list for `@lumirelle/linter-config`.

This bundle lists the Oxlint built-in plugins and the `jsPlugins` specifiers the config may enable, ships the packages
behind the specifiers it resolves, and contains no rule semantics of its own. Every rule, severity and file scope comes
from the config package.

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

## What It Runs Through `jsPlugins`

The remaining plugins are real ESLint plugins that Oxlint loads as JS plugins. This Bundle ships the packages behind
the Plugin ids the default Modules load and resolves each one to an absolute path while your config loads, so you
install the Bundle and nothing else for those.

The packages Upstream declares as optional peers stay your install, and the Module that needs one names it when it is
missing: `eslint-plugin-slop`, `eslint-plugin-solid`, `eslint-plugin-sonarjs`, `@unocss/eslint-plugin`, and
`@stylistic/eslint-plugin` when you turn `stylistic` on.

## License

[MIT](../../LICENSE.md) License © [Lumirelle](https://github.com/lumirelle)
