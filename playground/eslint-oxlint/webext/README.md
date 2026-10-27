# `eslint-oxlint/webext` example

A browser extension modelled on
[`lumirelle/starter-webext`](https://github.com/lumirelle/starter-webext). It is the snapshot the
application-type rule set is exercised against on a project that is neither a library nor a
framework application: `type: 'app'` drops the library-only rule slices, `test: true` lints the test
file, and `ignores` keeps the build output out of both Emissions. No framework Module is on — browser
code is plain TypeScript to this config, not a Vue or React application.

This is the paired flavor of the `webext` stack and the stack's canonical README: the predecessor
mapping and the tree below are written once. The two single-tool flavors strip one side of this
directory and link back here — [`eslint/webext`](../../eslint/webext/README.md) has no Oxlint config
module, [`oxlint/webext`](../../oxlint/webext/README.md) has no ESLint config module.

Predecessor snapshot: `lumirelle/starter-webext` at commit
[`fc10c13`](https://github.com/lumirelle/starter-webext/commit/fc10c135e060679039c389c963762621874d8b3d)
as of 2026-10-18.

## Previous configuration

```js
// eslint.config.js
import { antfu } from '@antfu/eslint-config'
import oxlint from 'eslint-plugin-oxlint'

export default antfu(
  {
    toml: {
      overrides: {
        'toml/array-element-newline': ['error', 'consistent'],
        'toml/array-bracket-spacing': ['error', 'never'],
        'toml/spaced-comment': ['error', 'always', { markers: [':schema'] }],
      },
    },
  },
  ...oxlint.buildFromOxlintConfigFile('.oxlintrc.json'),
)
```

```jsonc
// .oxlintrc.json
{
  "$schema": "./node_modules/oxlint/configuration_schema.json",
  "extends": ["./node_modules/@lumirelle/oxlint-config/.oxlintrc.ts.json"],
  "options": {
    "typeAware": true,
    "typeCheck": true
  },
  "env": {
    "builtin": true,
    "es2026": true,
    "browser": true,
    "node": true
  }
}
```

## This example's options

```ts
// options.ts
import type { Options } from '@lumirelle/linter-config/eslint'

export const options = {
  type: 'app',
  test: true,
  ignores: ['dist/**', 'extension/**', '.output/**'],
} satisfies Options
```

Both config files read that module, so ESLint and Oxlint cannot drift by configuration:

```js
// eslint.config.js
import { eslint } from '@lumirelle/linter-config/eslint'
import { options } from './options.ts'

export default eslint(options)
```

```ts
// oxlint.config.ts
import { oxlint } from '@lumirelle/linter-config/oxlint'
import { options } from './options.ts'

export default oxlint(options)
```

## Mapping the old call onto the options module

| Starter config | Here | Why |
| --- | --- | --- |
| `antfu({ ... })` | `eslint(options)` from `@lumirelle/linter-config/eslint` | The package is the whole rule set, so there is no `antfu` import left to pass options to. |
| `type` unset (Upstream defaults to an application) | `type: 'app'` | Stated rather than inferred: a WebExtension is an application, so the library-only slices of the `e18e` and `typescript` Modules stay off. |
| `toml.overrides` `'toml/array-element-newline': ['error', 'consistent']` and `'toml/array-bracket-spacing': ['error', 'never']` | omitted | Both are already this config's defaults for a TOML array: fully multi-line or fully single-line, and no inner bracket padding. |
| `toml.overrides` `'toml/spaced-comment': ['error', 'always', { markers: [':schema'] }]` | omitted | The rule belongs to the `stylistic` slice, which is off by default here. Turn it on with `stylistic: true`, and keep the marker list through `overrides: { 'lumirelle/toml/rules': { rules: { 'toml/spaced-comment': ['error', 'always', { markers: [':schema'] }] } } }`. |
| `...oxlint.buildFromOxlintConfigFile('.oxlintrc.json')` | `oxlint.config.ts`, built from the same options module | The Oxlint Emission comes from Source, so there is no `.oxlintrc.json` to read and no `eslint-plugin-oxlint` to install. Add `oxlint: true` to append the Bridge that turns off, in ESLint, the rules Oxlint reports; the example leaves it off so ESLint remains the only reporter. |
| `.oxlintrc.json` `extends: '@lumirelle/oxlint-config/.oxlintrc.ts.json'` | omitted | That preset is what `@lumirelle/linter-config/oxlint` replaces: the Emission carries the rules, so nothing extends a JSON file. |
| `.oxlintrc.json` `env.browser` / `es2026` / `builtin` / `node` | omitted | The `lumirelle/javascript/setup` object already declares browser, ES2021 and Node globals, and the Oxlint Emission carries the same names. |
| `.oxlintrc.json` `options.typeAware` + `typeCheck` | omitted | Both need a TypeScript project and the `oxlint-tsgolint` peer. A migrating project adds `typescript: { tsconfigPath: 'tsconfig.json' }` and `oxlint: { typeAware: true, typeCheck: true }`, as [`eslint-oxlint/ts`](../ts/README.md) does for the type-aware half. |
| `extension/` and `extension/dist` build output | `ignores: ['dist/**', 'extension/**', '.output/**']` | The build writes a packable directory, and a bundled file is not source: each Adapter applies the one list globally, as a `files`-less Config object on the ESLint side and as the root `ignorePatterns` on the Oxlint side. |
| — | `test: true` | Upstream defaults the `test` Module on; the example states it because `src/url-match.test.ts` is part of the source tree. |

## Install

The example declares the peers its Modules need; a project migrating from the starter installs the
same ones:

```sh
npm install -D @lumirelle/linter-config @lumirelle/linter-plugins-eslint @lumirelle/linter-plugins-oxlint eslint oxlint typescript
```

Delete the old `.oxlintrc.json`, `eslint-plugin-oxlint` and `@lumirelle/oxlint-config`: `oxlint.config.ts`
is discovered without a `-c` flag, and Oxlint refuses to load when both config files exist in one
directory.

There is nothing to install for the extension itself. The example ships no `vite`, `webextension-polyfill`
or `web-ext`, and no build is run: these are lint targets, and `vite.config.ts` calls no `defineConfig`
for the same reason.

## Tree

```text
playground/eslint-oxlint/webext/
├── eslint.config.js
├── oxlint.config.ts
├── options.ts
├── package.json
├── tsconfig.json          # extends @lumirelle/tsconfig/ts plus the DOM library; documentation, not built here
├── vite.config.ts         # the two entry points and the `extension` output; imports nothing
└── src/
    ├── background.ts      # the service worker entry point
    ├── content-script.ts  # the content-script entry point
    ├── manifest.ts        # the manifest the build writes out
    ├── url-match.test.ts  # the `test` Module's target
    └── url-match.ts
```
