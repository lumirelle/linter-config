# `eslint/vue` example

The ESLint-only flavor of the `vue` stack: [`eslint.config.js`](./eslint.config.js) is the whole
linter configuration, and the Emission it produces is the one ESLint reports in a project that runs
no Oxlint.

Compared with the paired flavor, [`eslint-oxlint/vue`](../../eslint-oxlint/vue/README.md), it strips:

- `oxlint.config.ts` — there is no Oxlint Emission;
- `oxlint` and `@lumirelle/linter-plugins-oxlint` from [`package.json`](./package.json).

Its [`eslint.config.js`](./eslint.config.js) writes the paired flavor's `options.ts` entries inline,
`vue: { a11y: true }` included, the way a project with one tool does: this stack sets no `oxlint`
entry to drop, so the Bridge is absent here for the same reason it is absent there, and both ESLint
flavors emit the same Config objects, the 22 `vue-a11y/*` rules among them.

The source tree, `tsconfig.json` and `uno.config.ts` are the same files as the paired flavor's. The
predecessor mapping, the options table, the tree and the peer-package reasoning live once, in
[`eslint-oxlint/vue/README.md`](../../eslint-oxlint/vue/README.md).

## Install

```sh
npm install -D @lumirelle/linter-config @lumirelle/linter-plugins-eslint eslint typescript \
  @unocss/eslint-plugin eslint-plugin-vuejs-accessibility
```

`eslint-plugin-vuejs-accessibility` is the extra peer `vue: { a11y: true }` requires, so this flavor
declares it for the same reason the paired one does.
