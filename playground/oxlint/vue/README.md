# `oxlint/vue` example

The Oxlint-only flavor of the `vue` stack: [`oxlint.config.ts`](./oxlint.config.ts) is the whole
linter configuration, and the Emission it produces is the one Oxlint reports in a project that runs
no ESLint.

Compared with the paired flavor, [`eslint-oxlint/vue`](../../eslint-oxlint/vue/README.md), it strips:

- `eslint.config.js` — there is no ESLint Emission, so no Bridge either;
- `eslint` and `@lumirelle/linter-plugins-eslint` from [`package.json`](./package.json).

It keeps the paired flavor's [`options.ts`](./options.ts) entries unchanged, `vue: { a11y: true }`
included: this stack sets no `oxlint` entry, so there is nothing the pair adds that this flavor
drops, and the Oxlint Emission here is the paired flavor's exactly. Vue files are read natively
through Oxlint's built-in `vue` scope, so no parser or processor is needed on this side.

## Why the framework peers stay

The manifest still declares `eslint-plugin-vuejs-accessibility` and `@unocss/eslint-plugin` even
though no ESLint config module exists here. Source's peer check is not a lint-time concern of one
Adapter: `requirePeerPackages` runs while Source is composed, before the Oxlint Adapter filters the
Config objects down to the Domains Oxlint can read, so `oxlint(options)` throws on a missing
`eslint-plugin-vuejs-accessibility` exactly as `eslint(options)` does. A project that runs Oxlint
alone with `vue: { a11y: true }` or `unocss: true` has to install these two packages; dropping them
from this manifest would document an install that does not work.

The 22 `vue-a11y/*` rules the sub-option adds stay ESLint-only — Oxlint has no built-in
counterpart — which is why this Emission carries fewer rules than the paired directory's ESLint one
while still requiring the plugin as a peer.

The source tree, `tsconfig.json` and `uno.config.ts` are the same files as the paired flavor's. The
predecessor mapping, the options table and the tree live once, in
[`eslint-oxlint/vue/README.md`](../../eslint-oxlint/vue/README.md).

## Install

```sh
npm install -D @lumirelle/linter-config @lumirelle/linter-plugins-oxlint oxlint typescript \
  @unocss/eslint-plugin eslint-plugin-vuejs-accessibility
```

The packages Oxlint loads through `jsPlugins` are ESLint plugins that declare `eslint` as a peer, so
a real Oxlint-only project may still need `eslint` installed even though this Emission imports
nothing from it. The example states its own flavor's tools and leaves that to your project.

There is no `.oxlintrc.json` beside the config module: Oxlint discovers `oxlint.config.ts` without a
`-c` flag, and refuses to load when both files exist in one directory.
