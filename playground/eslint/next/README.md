# `eslint/next` example

The ESLint-only flavor of the `next` stack: [`eslint.config.js`](./eslint.config.js) is the whole
linter configuration, and the Emission it produces is the one ESLint reports in a Next.js project
that runs no Oxlint.

Compared with the paired flavor, [`eslint-oxlint/next`](../eslint-oxlint/next/README.md), it strips:

- `oxlint.config.ts` — there is no Oxlint Emission;
- `oxlint` and `@lumirelle/linter-plugins-oxlint` from [`package.json`](./package.json).

Neither the paired flavor nor this one sets the `oxlint` entry, so no Bridge is appended in either
and the two Emissions carry the same objects: the flavor difference is the Oxlint config module
alone. The rest of [`options.ts`](./options.ts), the source tree and `tsconfig.json` are the same
files as the paired flavor's, and the three plugin peers — `@eslint-react/eslint-plugin`,
`eslint-plugin-react-refresh` and `@next/eslint-plugin-next` — stay declared.

The predecessor mapping, the options table, the tree, the React-pair explanation and the
installation caveat live once, in [`eslint-oxlint/next/README.md`](../eslint-oxlint/next/README.md).

## Install

```sh
npm install -D @lumirelle/linter-config @lumirelle/linter-plugins-eslint eslint typescript \
  @eslint-react/eslint-plugin eslint-plugin-react-refresh @next/eslint-plugin-next
```
