# `eslint/webext` example

The ESLint-only flavor of the `webext` stack: [`eslint.config.js`](./eslint.config.js) is the whole
linter configuration, and the Emission it produces is the one ESLint reports in a project that runs
no Oxlint.

Compared with the paired flavor, [`eslint-oxlint/webext`](../../eslint-oxlint/webext/README.md), it
strips:

- `oxlint.config.ts` — there is no Oxlint Emission;
- `oxlint` and `@lumirelle/linter-plugins-oxlint` from [`package.json`](./package.json).

The options are written inline in [`eslint.config.js`](./eslint.config.js), the way a project with
one tool writes them, and they keep the paired flavor's entries — including
`ignores: ['dist/**', 'extension/**', '.output/**']`, which the Adapter carries as a `files`-less
global ignore object here. There is nothing to remove for the Bridge: the
`webext` stack sets no `oxlint` entry in any flavor, so ESLint is the only reporter in both of the
flavors that ship an ESLint config.

Everything else — the source tree, `tsconfig.json`, `vite.config.ts` — is the same file as the paired
flavor's. The predecessor mapping, the options table, the tree and the installation caveat live once,
in [`eslint-oxlint/webext/README.md`](../../eslint-oxlint/webext/README.md).

## Install

```sh
npm install -D @lumirelle/linter-config @lumirelle/linter-plugins-eslint eslint typescript
```
