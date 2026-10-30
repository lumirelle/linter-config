# @lumirelle/linter-plugins-eslint

ESLint plugin objects for `@lumirelle/linter-config`.

This bundle only forwards plugins. It re-exports the third-party ESLint plugins, parsers and processor glue that `@lumirelle/linter-config/eslint` references by Plugin id, and it contains no rule semantics of its own: every rule, severity and file scope comes from the config package.

This bundle is an optional peer of the config package. A project that only runs Oxlint should install `@lumirelle/linter-plugins-oxlint` instead.

## Usage

> [!Note]
> Packages that `@antfu/eslint-config` treats as optional peers, such as the framework and language plugins, parsers and formatters, are not in this bundle. Install the ones your enabled Modules need. `@stylistic/eslint-plugin` is not in this bundle either: its Module is off by default because this config is meant for Oxfmt, so the plugin is an optional peer of the config package.

Install this package, then use it with `@lumirelle/linter-config/eslint`:

```nu
nub add @lumirelle/linter-plugins-eslint -D
# Or PNPM
pnpm add @lumirelle/linter-plugins-eslint -D
# Or NPM
npm install @lumirelle/linter-plugins-eslint -D
```

```js
// eslint.config.js
import { eslint } from '@lumirelle/linter-config/eslint'

export default eslint()
```

## License

[MIT](../../LICENSE.md) License © [Lumirelle](https://github.com/lumirelle)
