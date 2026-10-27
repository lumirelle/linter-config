# `eslint/ts-monorepo` example

The ESLint-only flavor of the `ts-monorepo` stack: [`eslint.config.js`](./eslint.config.js) is the
whole linter configuration, and the Emission it produces is the one ESLint reports in a workspace
that runs no Oxlint.

Compared with the paired flavor,
[`eslint-oxlint/ts-monorepo`](../../eslint-oxlint/ts-monorepo/README.md), it strips:

- `oxlint.config.ts` — there is no Oxlint Emission;
- the `oxlint` entry of [`options.ts`](./options.ts) — the Bridge is enabled by that entry alone, so
  this Emission keeps every rule the stack turns on instead of turning some off for Oxlint;
- `oxlint` and `@lumirelle/linter-plugins-oxlint` from [`package.json`](./package.json).

Everything else — the per-package `overrides` entry that narrows the type-aware rule block to
`packages/core/**/*.ts`, the other options, `tsconfig.json` and the nested `packages/` tree — is the same
file as the paired flavor's. The narrowing is part of the stack rather than of the linter, so it
survives the flavor change unchanged. The predecessor mapping, the options table, the tree and the
installation caveat live once, in
[`eslint-oxlint/ts-monorepo/README.md`](../../eslint-oxlint/ts-monorepo/README.md).

## Install

```sh
npm install -D @lumirelle/linter-config @lumirelle/linter-plugins-eslint eslint typescript
```
