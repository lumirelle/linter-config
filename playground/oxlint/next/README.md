# `oxlint/next` example

The Oxlint-only flavor of the `next` stack: [`oxlint.config.ts`](./oxlint.config.ts) is the whole
linter configuration, and the Emission it produces is the one Oxlint reports in a Next.js project
that runs no ESLint.

Compared with the paired flavor, [`eslint-oxlint/next`](../../eslint-oxlint/next/README.md), it strips:

- `eslint.config.js` — there is no ESLint Emission, so no Bridge either;
- `eslint` and `@lumirelle/linter-plugins-eslint` from [`package.json`](./package.json).

It keeps all three plugin peers the paired flavor declares. Source's peer check runs for both
Adapters, so an Oxlint-only Next project still installs `@eslint-react/eslint-plugin`,
`eslint-plugin-react-refresh` and `@next/eslint-plugin-next`; the Emission maps the React and Next
rules onto Oxlint's own `react` and `nextjs` plugin scopes instead of loading the plugins. The rest
of [`options.ts`](./options.ts), the source tree and `tsconfig.json` are the same files as the
paired flavor's.

The packages Oxlint loads through `jsPlugins` are ESLint plugins that declare `eslint` as a peer, so
a real Oxlint-only project may still need `eslint` installed even though this Emission imports
nothing from it. The example states its own flavor's tools and leaves that to your project.

The predecessor mapping, the options table and the tree live once, in
[`eslint-oxlint/next/README.md`](../../eslint-oxlint/next/README.md).

## Install

```sh
npm install -D @lumirelle/linter-config @lumirelle/linter-plugins-oxlint oxlint typescript \
  @eslint-react/eslint-plugin eslint-plugin-react-refresh @next/eslint-plugin-next
```

There is no `.oxlintrc.json` beside the config module: Oxlint discovers `oxlint.config.ts` without a
`-c` flag, and refuses to load when both files exist in one directory.
