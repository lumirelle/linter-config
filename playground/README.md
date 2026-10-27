# Playground

| Example | Simulates | Options it demonstrates | Guide |
| --- | --- | --- | --- |
| [`next`](./next/README.md) | A Next.js App Router project — canonical consumer, no starter counterpart | `react` and `nextjs` at `type: 'app'`, with the `test` Module | [`playground/next`](./next/README.md) |
| [`nuxt`](./nuxt/README.md) | [`lumirelle/starter-nuxt`](https://github.com/lumirelle/starter-nuxt) — a Nuxt application | The Vue and UnoCSS Modules, application type, and why the generated Nuxt ESLint config is not composed | [`playground/nuxt`](./nuxt/README.md) |
| [`react`](./react/README.md) | A Vite-style React single-page application — canonical consumer, no starter counterpart | `react`, `jsx` and `unocss` at `type: 'app'`, with the `test` Module | [`playground/react`](./react/README.md) |
| [`ts`](./ts/README.md) | [`antfu/starter-ts`](https://github.com/antfu/starter-ts) — a TypeScript library | `type: 'lib'`, `typescript.tsconfigPath`, type-aware Oxlint, and the `test` Module | [`playground/ts`](./ts/README.md) |
| [`ts-monorepo`](./ts-monorepo/README.md) | [`lumirelle/starter-ts-monorepo`](https://github.com/lumirelle/starter-ts-monorepo) — a TypeScript monorepo | the `ts` options across several packages, plus a per-package `overrides` entry | [`playground/ts-monorepo`](./ts-monorepo/README.md) |
| [`vue`](./vue/README.md) | A Vite-style Vue single-page application — no starter counterpart | The Vue Module's `a11y` sub-option, the peer it requires, and UnoCSS | [`playground/vue`](./vue/README.md) |
| [`webext`](./webext/README.md) | [`lumirelle/starter-webext`](https://github.com/lumirelle/starter-webext) — a browser extension | `type: 'app'`, build-output `ignores`, and the `test` Module | [`playground/webext`](./webext/README.md) |

## Running an example

```sh
mise run play ts           # both Emissions for one example
mise run play next         # a Next.js App Router project
mise run play nuxt         # a Nuxt application
mise run play react        # a React single-page application
mise run play ts-monorepo  # a TypeScript monorepo
mise run play vue          # a Vue single-page application
mise run play webext       # a browser extension
mise run play --all        # both Emissions for every example
```

The task depends on `mise run build`, because each example's config files import the package's built
`@lumirelle/linter-config/eslint` and `@lumirelle/linter-config/oxlint` subpaths, never Source
internals.

## Layout

Each example is a directory with:

- `package.json` — a private package declaring the peers its Modules need;
- `options.ts` — the one options object both configs are built from;
- `eslint.config.js` and `oxlint.config.ts` — the paired configs, each importing the public subpath;
- `tsconfig.json` — the example's project file, documentation rather than part of this repository's
  type check;
- a minimal representative source tree and a README mapping the predecessor configuration.

[`examples.ts`](./examples.ts) is the registry: it discovers examples by reading
`playground/*/package.json` and resolves one by importing its options and config modules. Adding an
example is adding its directory; no registry, task or unused-dependency edit is needed.

[`index.ts`](./index.ts) is the runner behind `mise run play`.

## Scope

Examples install only the lint-time peers their enabled Modules require. The frameworks they
simulate (Vue, React, Next, Vite, UnoCSS) are deliberately **not** installed: these are lint targets,
not applications, and the root dogfood configuration does not lint their source trees either.
