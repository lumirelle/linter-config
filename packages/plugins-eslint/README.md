# @lumirelle/linter-plugins-eslint

ESLint plugin objects for `@lumirelle/linter-config`.

This bundle only forwards plugins: it re-exports the third-party ESLint plugins, parsers and processor glue that `@lumirelle/linter-config/eslint` references by Plugin id, and it contains no rule semantics of its own. Every rule, severity and file scope comes from the config package, so a rule change never lands here.

`@lumirelle/linter-config`, `@lumirelle/linter-plugins-eslint` and `@lumirelle/linter-plugins-oxlint` are released in lockstep: a plugin upgrade bumps this bundle and both other packages together, so their versions always match and there is no "which bundle goes with which config" question.

This bundle is an optional peer of the config package. A project that only runs Oxlint installs `@lumirelle/linter-plugins-oxlint` instead.

## Usage

Consumers do not import this package; the config package resolves it:

```js
// eslint.config.js
import { eslint } from '@lumirelle/linter-config/eslint'

export default eslint()
```

The packages Upstream treats as optional peers (framework and language plugins, parsers, formatters) are not in this bundle, because the consumer installs the ones their enabled Modules need.

## License

[MIT](../../LICENSE.md) License © [Lumirelle](https://github.com/lumirelle)
