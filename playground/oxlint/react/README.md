# `oxlint/react` example

The Oxlint-only flavor of the `react` stack: [`oxlint.config.ts`](./oxlint.config.ts) is the whole
linter configuration, and the Emission it produces is the one Oxlint reports in a project that runs
no ESLint.

Compared with the paired flavor, [`eslint-oxlint/react`](../../eslint-oxlint/react/README.md), it
strips:

- `eslint.config.js` — there is no ESLint Emission, so no Bridge either;
- `eslint` and `@lumirelle/linter-plugins-eslint` from [`package.json`](./package.json).

Its [`oxlint.config.ts`](./oxlint.config.ts) writes the paired flavor's `options.ts` entries inline,
the way a project with one tool does: this stack sets no `oxlint` entry, so there is nothing the pair
adds that this flavor drops.

## Why the framework peers stay

The manifest still declares `@eslint-react/eslint-plugin`, `eslint-plugin-react-refresh` and
`@unocss/eslint-plugin` even though no ESLint config module exists here. Source's peer check is not
a lint-time concern of one Adapter: `requirePeerPackages` runs while Source is composed, before the
Oxlint Adapter filters the Config objects down to the Domains Oxlint can read, so `oxlint(options)`
throws on a missing peer exactly as `eslint(options)` does. A project that runs Oxlint alone and
enables `react` or `unocss` has to install these three packages; dropping them from this manifest
would document an install that does not work.

The source tree, `tsconfig.json` and `uno.config.ts` are the same files as the paired flavor's. The
predecessor mapping, the options table and the tree live once, in
[`eslint-oxlint/react/README.md`](../../eslint-oxlint/react/README.md).

## Install

```sh
npm install -D @lumirelle/linter-config @lumirelle/linter-plugins-oxlint oxlint typescript \
  @eslint-react/eslint-plugin eslint-plugin-react-refresh @unocss/eslint-plugin
```

The packages Oxlint loads through `jsPlugins` are ESLint plugins that declare `eslint` as a peer, so
a real Oxlint-only project may still need `eslint` installed even though this Emission imports
nothing from it. The example states its own flavor's tools and leaves that to your project.

There is no `.oxlintrc.json` beside the config module: Oxlint discovers `oxlint.config.ts` without a
`-c` flag, and refuses to load when both files exist in one directory.
