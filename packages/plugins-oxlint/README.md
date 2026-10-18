# @lumirelle/linter-plugins-oxlint

Oxlint plugin data for `@lumirelle/linter-config`.

This bundle only forwards package names: it lists the Oxlint built-in plugins the config may enable and the `jsPlugins` specifiers that fill the gaps, and it contains no rule semantics of its own. Every rule, severity and file scope comes from the config package, so a rule change never lands here.

`@lumirelle/linter-config`, `@lumirelle/linter-plugins-eslint` and `@lumirelle/linter-plugins-oxlint` are released in lockstep: a plugin upgrade bumps this bundle and both other packages together, so their versions always match and there is no "which bundle goes with which config" question.

This bundle is an optional peer of the config package. A project that only runs ESLint installs `@lumirelle/linter-plugins-eslint` instead.

Oxlint's `jsPlugins` are alpha and outside semver. Oxlint also resolves a specifier from the config file's directory, never from this bundle, so the packages listed here must be among the consuming project's own dependencies.

## Usage

Consumers do not import this package; the config package resolves it:

```ts
// oxlint.config.ts
import { oxlint } from '@lumirelle/linter-config/oxlint'

export default oxlint()
```

## License

[MIT](../../LICENSE.md) License © [Lumirelle](https://github.com/lumirelle)
