# `eslint/ts` example

The ESLint-only flavor of the `ts` stack: [`eslint.config.js`](./eslint.config.js) is the whole
linter configuration, and the Emission it produces is the one ESLint reports in a project that runs
no Oxlint.

Compared with the paired flavor, [`eslint-oxlint/ts`](../eslint-oxlint/ts/README.md), it strips:

- `oxlint.config.ts` — there is no Oxlint Emission;
- the `oxlint` entry of [`options.ts`](./options.ts) — the Bridge is enabled by that entry alone, so
  this Emission keeps every rule the stack turns on instead of turning some off for Oxlint;
- `oxlint` and `@lumirelle/linter-plugins-oxlint` from [`package.json`](./package.json).

Everything else — the options module's other entries, the source tree, `tsconfig.json` — is the
same file as the paired flavor's. The predecessor mapping, the options table, the tree and the
installation caveat live once, in [`eslint-oxlint/ts/README.md`](../eslint-oxlint/ts/README.md).

## Install

```sh
npm install -D @lumirelle/linter-config @lumirelle/linter-plugins-eslint eslint typescript
```
