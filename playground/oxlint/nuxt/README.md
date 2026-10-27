# `oxlint/nuxt` example

The Oxlint-only flavor of the `nuxt` stack: [`oxlint.config.ts`](./oxlint.config.ts) is the whole
linter configuration, and the Emission it produces is the one Oxlint reports in a Nuxt project that
runs no ESLint.

Compared with the paired flavor, [`eslint-oxlint/nuxt`](../../eslint-oxlint/nuxt/README.md), it strips:

- `eslint.config.js` — there is no ESLint Emission, so no Bridge either;
- `eslint` and `@lumirelle/linter-plugins-eslint` from [`package.json`](./package.json).

It keeps `@unocss/eslint-plugin`: the `unocss` Module's peer check runs for both Adapters, and this
Emission loads the plugin through Oxlint's `jsPlugins`, so an Oxlint-only Nuxt project still
installs it. That package declares `eslint` as a peer, so a real project may need `eslint` installed
even though this Emission imports nothing from it. The example states its own flavor's tools and
leaves that to your project.

The options are written inline in [`oxlint.config.ts`](./oxlint.config.ts), the way a project with
one tool writes them, and they repeat the paired flavor's `options.ts` entries; the source tree,
`tsconfig.json`, `nuxt.config.ts` and `uno.config.ts` are the same files as the paired flavor's.

The predecessor mapping, the options table and the tree live once, in
[`eslint-oxlint/nuxt/README.md`](../../eslint-oxlint/nuxt/README.md).

## Install

```sh
npm install -D @lumirelle/linter-config @lumirelle/linter-plugins-oxlint @unocss/eslint-plugin oxlint typescript
```

There is no `.oxlintrc.json` beside the config module: Oxlint discovers `oxlint.config.ts` without a
`-c` flag, and refuses to load when both files exist in one directory.
