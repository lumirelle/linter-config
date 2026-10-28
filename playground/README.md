# Playground

21 examples: seven stacks, each shipped in all three flavors of the linter dimension, so
every example is named `<flavor>/<stack>`.

| Stack | Simulates | `eslint` | `oxlint` | `eslint-oxlint` |
| --- | --- | --- | --- | --- |
| `next` | A Next.js App Router project — canonical consumer, no starter counterpart | [`eslint/next`](./eslint/next/README.md) | [`oxlint/next`](./oxlint/next/README.md) | [`eslint-oxlint/next`](./eslint-oxlint/next/README.md) |
| `nuxt` | [`lumirelle/starter-nuxt`](https://github.com/lumirelle/starter-nuxt) — a Nuxt application | [`eslint/nuxt`](./eslint/nuxt/README.md) | [`oxlint/nuxt`](./oxlint/nuxt/README.md) | [`eslint-oxlint/nuxt`](./eslint-oxlint/nuxt/README.md) |
| `react` | A Vite-style React single-page application — canonical consumer, no starter counterpart | [`eslint/react`](./eslint/react/README.md) | [`oxlint/react`](./oxlint/react/README.md) | [`eslint-oxlint/react`](./eslint-oxlint/react/README.md) |
| `ts` | [`antfu/starter-ts`](https://github.com/antfu/starter-ts) — a TypeScript library | [`eslint/ts`](./eslint/ts/README.md) | [`oxlint/ts`](./oxlint/ts/README.md) | [`eslint-oxlint/ts`](./eslint-oxlint/ts/README.md) |
| `ts-monorepo` | [`lumirelle/starter-ts-monorepo`](https://github.com/lumirelle/starter-ts-monorepo) — a TypeScript monorepo | [`eslint/ts-monorepo`](./eslint/ts-monorepo/README.md) | [`oxlint/ts-monorepo`](./oxlint/ts-monorepo/README.md) | [`eslint-oxlint/ts-monorepo`](./eslint-oxlint/ts-monorepo/README.md) |
| `vue` | A Vite-style Vue single-page application — no starter counterpart | [`eslint/vue`](./eslint/vue/README.md) | [`oxlint/vue`](./oxlint/vue/README.md) | [`eslint-oxlint/vue`](./eslint-oxlint/vue/README.md) |
| `webext` | [`lumirelle/starter-webext`](https://github.com/lumirelle/starter-webext) — a browser extension | [`eslint/webext`](./eslint/webext/README.md) | [`oxlint/webext`](./oxlint/webext/README.md) | [`eslint-oxlint/webext`](./eslint-oxlint/webext/README.md) |

## Running an example

```sh
mise run play ts           # all three flavors of the `ts` stack
mise run play eslint/ts    # one flavor of it
mise run play --all        # all twenty-one examples
```

A bare stack name expands into its flavors in `eslint`, `oxlint`, `eslint-oxlint` order; a
flavor-qualified name prints one example; `--all` walks every stack in sorted order.

The task depends on `mise run build`, because each example's config files import the package's built
`@lumirelle/linter-config/eslint` and `@lumirelle/linter-config/oxlint` subpaths, not Source
internals.

## Layout

Each example is a directory under `playground/<flavor>/<stack>/` with:

- `package.json` — a private package declaring the peers its Modules need, that flavor's tool
  packages, and — only in a flavor that runs Oxlint — the bundled plugins Oxlint resolves from the
  project instead of from the Plugin Bundle.
- the linter config modules its flavor runs — `eslint.config.js` for `eslint` and `eslint-oxlint`,
  `oxlint.config.ts` for `oxlint` and `eslint-oxlint`.
- `options.ts` — only in the paired flavor: two configs read one object, so it is extracted. A
  single-tool flavor writes the same options inline where it calls its one factory, the way a
  project that runs one tool does.
- `tsconfig.json` — the example's project file, documentation rather than part of this repository's
  type check.
- a minimal representative source tree and a README.

A stack's three directories are identical apart from the linter config modules, the options module
(present in the paired flavor, inline elsewhere), the flavor-owned packages in the manifest and the
README.

## Scope

Examples install only the lint-time packages their enabled Modules require: the peers, and the
bundled plugins a `jsPlugins` entry makes Oxlint resolve from the project. The technologies they
simulate (Vue, React, Next, Vite, UnoCSS) are deliberately **not** installed.
