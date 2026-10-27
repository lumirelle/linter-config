# `oxlint/webext` example

The Oxlint-only flavor of the `webext` stack: [`oxlint.config.ts`](./oxlint.config.ts) is the whole
linter configuration, and the Emission it produces is the one Oxlint reports in a project that runs
no ESLint.

Compared with the paired flavor, [`eslint-oxlint/webext`](../../eslint-oxlint/webext/README.md), it
strips:

- `eslint.config.js` — there is no ESLint Emission, so no Bridge either;
- `eslint` and `@lumirelle/linter-plugins-eslint` from [`package.json`](./package.json).

The options module is the stack's rather than the flavor's, so this directory keeps it as the paired
flavor has it — including `ignores: ['dist/**', 'extension/**', '.output/**']`, which this Adapter
carries as the Emission's root `ignorePatterns` rather than as an override glob. The rest of the
options module, the source tree, `tsconfig.json` and `vite.config.ts` are the same files as the
paired flavor's.

The packages Oxlint loads through `jsPlugins` are ESLint plugins that declare `eslint` as a peer, so
a real Oxlint-only project may still need `eslint` installed even though this Emission imports
nothing from it. The example states its own flavor's tools and leaves that to your project.

The predecessor mapping, the options table and the tree live once, in
[`eslint-oxlint/webext/README.md`](../../eslint-oxlint/webext/README.md).

## Install

```sh
npm install -D @lumirelle/linter-config @lumirelle/linter-plugins-oxlint oxlint typescript
```

There is no `.oxlintrc.json` beside the config module: Oxlint discovers `oxlint.config.ts` without a
`-c` flag, and refuses to load when both files exist in one directory.
