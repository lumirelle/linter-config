# `eslint/nuxt` example

The ESLint-only flavor of the `nuxt` stack: [`eslint.config.js`](./eslint.config.js) is the whole
linter configuration, and the Emission it produces is the one ESLint reports in a Nuxt project that
runs no Oxlint.

Compared with the paired flavor, [`eslint-oxlint/nuxt`](../../eslint-oxlint/nuxt/README.md), it strips:

- `oxlint.config.ts` — there is no Oxlint Emission;
- `oxlint` and `@lumirelle/linter-plugins-oxlint` from [`package.json`](./package.json).

Neither the paired flavor nor this one sets the `oxlint` entry, so no Bridge is appended in either
and the two Emissions carry the same objects: the flavor difference is the Oxlint config module
alone. The options are written inline in [`eslint.config.js`](./eslint.config.js), the way a project
with one tool writes them, and they repeat the paired flavor's `options.ts` entries; the source tree,
`tsconfig.json`, `nuxt.config.ts` and `uno.config.ts` are the same files as the paired flavor's.
`@unocss/eslint-plugin` stays declared, because the `unocss` Module's peer check runs here too.

The predecessor mapping, the options table, the tree and the installation caveat live once, in
[`eslint-oxlint/nuxt/README.md`](../../eslint-oxlint/nuxt/README.md).

## Install

```sh
npm install -D @lumirelle/linter-config @lumirelle/linter-plugins-eslint @unocss/eslint-plugin eslint typescript
```
