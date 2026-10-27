# Playground

Twenty-one examples: seven stacks, each shipped in all three flavors of the linter dimension, so
every example is named `<flavor>/<stack>`. [ADR 0005](../docs/adr/0005-flavor-first-playground.md)
records the matrix, what a flavor may change and why the directories are duplicated rather than
shared.

| Stack | Simulates | `eslint` | `oxlint` | `eslint-oxlint` |
| --- | --- | --- | --- | --- |
| `next` | A Next.js App Router project — canonical consumer, no starter counterpart | [`eslint/next`](./eslint/next/README.md) | [`oxlint/next`](./oxlint/next/README.md) | [`eslint-oxlint/next`](./eslint-oxlint/next/README.md) |
| `nuxt` | [`lumirelle/starter-nuxt`](https://github.com/lumirelle/starter-nuxt) — a Nuxt application | [`eslint/nuxt`](./eslint/nuxt/README.md) | [`oxlint/nuxt`](./oxlint/nuxt/README.md) | [`eslint-oxlint/nuxt`](./eslint-oxlint/nuxt/README.md) |
| `react` | A Vite-style React single-page application — canonical consumer, no starter counterpart | [`eslint/react`](./eslint/react/README.md) | [`oxlint/react`](./oxlint/react/README.md) | [`eslint-oxlint/react`](./eslint-oxlint/react/README.md) |
| `ts` | [`antfu/starter-ts`](https://github.com/antfu/starter-ts) — a TypeScript library | [`eslint/ts`](./eslint/ts/README.md) | [`oxlint/ts`](./oxlint/ts/README.md) | [`eslint-oxlint/ts`](./eslint-oxlint/ts/README.md) |
| `ts-monorepo` | [`lumirelle/starter-ts-monorepo`](https://github.com/lumirelle/starter-ts-monorepo) — a TypeScript monorepo | [`eslint/ts-monorepo`](./eslint/ts-monorepo/README.md) | [`oxlint/ts-monorepo`](./oxlint/ts-monorepo/README.md) | [`eslint-oxlint/ts-monorepo`](./eslint-oxlint/ts-monorepo/README.md) |
| `vue` | A Vite-style Vue single-page application — no starter counterpart | [`eslint/vue`](./eslint/vue/README.md) | [`oxlint/vue`](./oxlint/vue/README.md) | [`eslint-oxlint/vue`](./eslint-oxlint/vue/README.md) |
| `webext` | [`lumirelle/starter-webext`](https://github.com/lumirelle/starter-webext) — a browser extension | [`eslint/webext`](./eslint/webext/README.md) | [`oxlint/webext`](./oxlint/webext/README.md) | [`eslint-oxlint/webext`](./eslint-oxlint/webext/README.md) |

Each row's three links go to the example directory, whose README carries the options that stack
demonstrates. The `eslint-oxlint` README is the stack's canonical one — predecessor mapping, options
table, tree and installation caveats — because that content is stack knowledge; the two single-tool
READMEs name what their flavor strips and link back to it.

## Running an example

```sh
mise run play ts           # all three flavors of the `ts` stack
mise run play eslint/ts    # one flavor of it
mise run play --all        # all twenty-one examples
```

A bare stack name expands into its flavors in `eslint`, `oxlint`, `eslint-oxlint` order; a
flavor-qualified name prints one example; `--all` walks every stack in sorted order. One stack is
three examples, so a bare stack name never means a single Emission and there is no alias that makes
it one. An unknown name exits non-zero after listing the names that do exist.

The task depends on `mise run build`, because each example's config files import the package's built
`@lumirelle/linter-config/eslint` and `@lumirelle/linter-config/oxlint` subpaths, never Source
internals.

## Layout

Each example is a directory under `playground/<flavor>/<stack>/` with:

- `package.json` — a private package declaring the peers its Modules need, plus that flavor's tool
  packages;
- `options.ts` — the one options object the flavor's config modules are built from;
- the linter config modules its flavor runs — `eslint.config.js` for `eslint` and `eslint-oxlint`,
  `oxlint.config.ts` for `oxlint` and `eslint-oxlint`;
- `tsconfig.json` — the example's project file, documentation rather than part of this repository's
  type check;
- a minimal representative source tree and a README.

A stack's three directories are identical apart from the linter config modules, the `oxlint` entry of
the options module, the tool packages in the manifest and the README. `test/examples/layout.test.ts`
asserts that file set and compares the remaining files byte for byte, so drift is a failing test
rather than a review responsibility.

[`examples.ts`](./examples.ts) is the registry: it discovers examples by reading
`playground/*/*/package.json` and resolves one by importing its options and config modules. Adding a
stack or a flavor is adding its directory; no registry, task or unused-dependency edit is needed.

[`index.ts`](./index.ts) is the runner behind `mise run play`.

## Naming

The flavor token is the directory segment, the example-name segment and the package-name segment at
once, so a package is named after its directory and the name the runner prints is the name of a real
path. The paired flavor is `eslint-oxlint` rather than `eslint+oxlint` because npm package names
cannot contain `+`, which would have made the directory token and the package token diverge for the
one flavor a reader is most likely to copy.

## Scope

Examples install only the lint-time peers their enabled Modules require. The frameworks they
simulate (Vue, React, Next, Vite, UnoCSS) are deliberately **not** installed: these are lint targets
and resolution proofs, not applications, and the root dogfood configuration does not lint their
source trees either.
