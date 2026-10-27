# `eslint-oxlint/ts-monorepo` example

A TypeScript monorepo modelled on [`lumirelle/starter-ts-monorepo`](https://github.com/lumirelle/starter-ts-monorepo).
It is the snapshot the workspace-level options are exercised against: one `options.ts` at the root
lints every package under `packages/`, `type: 'lib'` keeps the library rule slices,
`typescript.tsconfigPath` turns on the type-aware rules, `oxlint: { typeAware: true }` makes Oxlint
implement the type-aware rules it can, and one `overrides` entry narrows a single package's rules
without a second config file.

This is the paired flavor of the `ts-monorepo` stack and the stack's canonical README: the
predecessor mapping and the tree below are written once. The two single-tool flavors strip one side
of this directory and link back here — [`eslint/ts-monorepo`](../../eslint/ts-monorepo/README.md) has
no Oxlint and no Bridge, [`oxlint/ts-monorepo`](../../oxlint/ts-monorepo/README.md) has no ESLint
config module.

Predecessor snapshot: `lumirelle/starter-ts-monorepo` at commit
[`e0c607c`](https://github.com/lumirelle/starter-ts-monorepo/commit/e0c607c653861020980c3c0b467b65dd21d7f4fa)
as of 2026-10-18.

## Previous configuration

The starter kept one config at the workspace root and a separate Oxlint file beside it:

```js
// eslint.config.js
import { antfu } from '@antfu/eslint-config'
import oxlint from 'eslint-plugin-oxlint'

export default antfu(
  {
    type: 'lib',
    toml: {
      overrides: {
        'toml/array-element-newline': ['error', 'consistent'],
        'toml/array-bracket-spacing': ['error', 'never'],
      },
    },
  },
  ...oxlint.buildFromOxlintConfigFile('.oxlintrc.json'),
)
```

```json
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
  },
  "ignorePatterns": ["README.md", "test/__snapshots__/**"]
}
```

## This example's options

```ts
// options.ts
import type { Options } from '@lumirelle/linter-config/eslint'

export const options = {
  type: 'lib',
  typescript: { tsconfigPath: 'tsconfig.json' },
  oxlint: { typeAware: true },
  test: true,
  overrides: {
    'lumirelle/typescript/rules-type-aware': {
      files: ['packages/core/**/*.ts'],
      rules: {
        'ts/no-unsafe-assignment': 'off',
      },
    },
  },
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

## Per-package overrides

An `overrides` key is either a Module id, which hits every Config object of that Module, or one
Config object name (`lumirelle/<tail>`), which hits exactly that object. The example uses the second
form, because only one object should move:

```ts
// options.ts, the field of the same name
export const overrides = {
  'lumirelle/typescript/rules-type-aware': {
    files: ['packages/core/**/*.ts'],
    rules: { 'ts/no-unsafe-assignment': 'off' },
  },
} satisfies Options['overrides']
```

`rules` merges into the object's rules, while `files` and `ignores` **replace** its scope. That is
what makes the entry a per-package deviation: the type-aware rule block — the slowest part of the
Emission — now covers the TypeScript sources of `packages/core` alone, and `packages/cli` keeps
every non-type-aware rule. The type-aware parser is a different object, so it keeps its own scope
and every package still parses with the project service. Narrowing the Module
(`overrides.typescript`) would instead have rescoped the Module's plugin-declaration object too,
which is why the example names the rule block.

The scope names a TypeScript glob rather than the whole package directory on purpose: `files`
replaces the block's scope verbatim, a package directory also holds its `package.json`, and a rule
that needs type information throws on a file no parser project covers. A bare `packages/core/**`
therefore applies the block to the manifest too, which only stays invisible while a Bridge is turning
those rules off — an ESLint-only project has no Bridge, and the run fails.

The rule that changes is the boundary package's: `packages/core` reads untrusted payloads, where an
untyped value is unavoidable, so `ts/no-unsafe-assignment` is off there and every other type-aware
rule stays on.

## Mapping the old call onto the options module

| Starter config | Here | Why |
| --- | --- | --- |
| `type: 'lib'` | kept | Library rule slices on for all packages, application-only defaults off. |
| `toml.overrides` — the two array rules | omitted | The `toml` Module already carries those two overrides as its house rules, and it is on by default; `toml: true` states it if you want it explicit. |
| `...oxlint.buildFromOxlintConfigFile('.oxlintrc.json')` | `oxlint: { typeAware: true }` | Source emits both tools from one object and appends the Bridge itself. Delete the call and the file. |
| `.oxlintrc.json` → `extends: [@lumirelle/oxlint-config/.oxlintrc.ts.json]` | omitted | The presets live in Source now; an `.oxlintrc.json` beside `oxlint.config.ts` would make Oxlint refuse to load. |
| `.oxlintrc.json` → `options.typeAware` | `oxlint: { typeAware: true }` | The same switch, read by both Emissions. |
| `.oxlintrc.json` → `options.typeCheck` | omitted | Forwarded as-is, and it needs the `oxlint-tsgolint` peer. This example does not install it; a project that does passes `oxlint: { typeAware: true, typeCheck: true }`. |
| `.oxlintrc.json` → `env` | omitted | The `node` Module derives each Domain's globals; a project that needs more adds them through a Config object override. |
| `.oxlintrc.json` → `ignorePatterns` | omitted | `**/__snapshots__` is already in the shared ignore set Source emits, and `README.md` is not an Oxlint target once the Markdown Module owns it. |
| Root `package.json` → `workspaces`, `mise.toml` → `config_roots`, `knip.jsonc`, `hk.pkl` | not reproduced | This repository owns that tooling; the example maps only the lint configuration. |
| — | `test: true` | Upstream defaults the `test` Module on; the example states it because `packages/core/src/parse.test.ts` is part of the source tree. |
| — | `overrides` | Has no predecessor: the starter had one rule set for the whole workspace. This is the field the example exists to show. |

## Install

The example declares the peers its Modules need; a project migrating from the starter installs the
same ones:

```sh
npm install -D @lumirelle/linter-config @lumirelle/linter-plugins-eslint @lumirelle/linter-plugins-oxlint eslint oxlint typescript
```

There is no `.oxlintrc.json` to keep: `oxlint.config.ts` is discovered without a `-c` flag, and
Oxlint refuses to load when both files exist in one directory. Delete the old file when migrating.

## Tree

```text
playground/eslint-oxlint/ts-monorepo/
├── eslint.config.js       # one config for the whole workspace
├── oxlint.config.ts
├── options.ts             # the one options object, including the per-package override
├── package.json
├── tsconfig.json          # extends @lumirelle/tsconfig/ts over packages/*/src; not built here
└── packages/
    ├── core/              # the package the override narrows
    │   ├── package.json
    │   └── src/
    │       ├── index.ts
    │       ├── parse.test.ts
    │       └── parse.ts
    └── cli/
        ├── package.json
        └── src/
            └── index.ts
```

The two directories under `packages/` are plain packages, not workspace packages: this repository's
workspace glob is `playground/*/*`, which reaches an example directory and its nested `packages/` no
further, so they contribute sources and manifests to the example without being installed on their
own. That is why all three flavors can ship the same package manifests.
