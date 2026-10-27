# `eslint/react` example

The ESLint-only flavor of the `react` stack: [`eslint.config.js`](./eslint.config.js) is the whole
linter configuration, and the Emission it produces is the one ESLint reports in a project that runs
no Oxlint.

Compared with the paired flavor, [`eslint-oxlint/react`](../../eslint-oxlint/react/README.md), it
strips:

- `oxlint.config.ts` — there is no Oxlint Emission;
- `oxlint` and `@lumirelle/linter-plugins-oxlint` from [`package.json`](./package.json).

It keeps the paired flavor's [`options.ts`](./options.ts) entries unchanged, because this stack sets
no `oxlint` entry to drop: the Bridge is enabled by that entry alone, and `react` never sets it, so
this Emission and the paired flavor's carry the same Config objects.

The source tree, `tsconfig.json` and `uno.config.ts` are the same files as the paired flavor's. The
predecessor mapping, the options table, the tree and the peer-package reasoning live once, in
[`eslint-oxlint/react/README.md`](../../eslint-oxlint/react/README.md).

## Install

```sh
npm install -D @lumirelle/linter-config @lumirelle/linter-plugins-eslint eslint typescript \
  @eslint-react/eslint-plugin eslint-plugin-react-refresh @unocss/eslint-plugin
```

The `react` Module's two plugins and the `unocss` Module's one are peers, so this flavor declares
them for the same reason the paired one does.
