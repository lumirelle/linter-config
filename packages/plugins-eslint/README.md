# @lumirelle/linter-plugins-eslint

ESLint plugin objects for `@lumirelle/linter-config`.

This bundle only forwards plugins: it re-exports the third-party ESLint plugins, parsers and processor glue that `@lumirelle/linter-config/eslint` references by Plugin id, and it contains no rule semantics of its own. Every rule, severity and file scope comes from the config package.

This bundle is an optional peer of the config package. A project that only runs Oxlint should install `@lumirelle/linter-plugins-oxlint` instead.

## Usage

> [!Note]
> The packages which the Upstream (`@antfu/eslint-config`) treats as optional peers (some framework and language plugins, parsers, formatters) are not in this bundle; install the ones their enabled Modules need.

Install this package and use this with `@lumirelle/linter-config/eslint`:

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
