# `eslint-oxlint/ts` example

A TypeScript library modelled on [`antfu/starter-ts`](https://github.com/antfu/starter-ts). It is
the snapshot the library-specific options are exercised against: `type: 'lib'` keeps the library
rule slices, `typescript.tsconfigPath` turns on the type-aware rules, `oxlint: { typeAware: true }`
makes Oxlint implement the type-aware rules it can, and `test: true` lints the test file.

This is the paired flavor of the `ts` stack and the stack's canonical README: the predecessor
mapping below is written once. The two single-tool flavors strip one side of this directory and
link back here — [`eslint/ts`](../../eslint/ts/README.md) has no Oxlint and no Bridge,
[`oxlint/ts`](../../oxlint/ts/README.md) has no ESLint config module.

Predecessor snapshot: `antfu/starter-ts` at commit
[`13b0323`](https://github.com/antfu/starter-ts/commit/13b03234a7ea2ae9b2f1ad1a152e65e7202d3631)
as of 2026-10-18.

## Previous configuration

```js
// eslint.config.js
import antfu from '@antfu/eslint-config'

export default antfu({
  type: 'lib',
  pnpm: true,
  antislop: true,
})
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
| `type: 'lib'` | kept | Library rule slices on, application-only defaults off. |
| `pnpm: true` | omitted | This repository installs with nub. In a pnpm project keep `pnpm: true`; without the option the `pnpm` Module still turns itself on when a `pnpm-workspace.yaml` exists. |
| `antislop: true` | omitted | The `antislop` Module needs the `eslint-plugin-slop` peer, and this snapshot stays off until a project installs it. Add `antislop: true` together with the plugin if you want those rules. |
| `tsconfig.json` read by the editor only | `typescript: { tsconfigPath: 'tsconfig.json' }` | Type-aware rules need the project file on both sides; Oxlint reads it in its own type-aware mode, and the Bridge turns those rules off in ESLint only where Oxlint reports them. |
| — | `test: true` | Upstream defaults the `test` Module on; the example states it because `src/greet.test.ts` is part of the source tree. |

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
playground/eslint-oxlint/ts/
├── eslint.config.js
├── oxlint.config.ts
├── options.ts
├── package.json
├── tsconfig.json          # extends @lumirelle/tsconfig/ts; documentation, not built here
└── src/
    ├── greet.test.ts      # the `test` Module's target
    ├── greet.ts
    └── index.ts
```
