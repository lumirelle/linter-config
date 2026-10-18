# `react` example

A Vite-style React single-page application. It enables the React, JSX and UnoCSS Modules at
application type, with the test Module on: `react: true` adds `@eslint-react/eslint-plugin` and
`eslint-plugin-react-refresh`, `jsx: true` the JSX parser flag, `unocss: true` the class-order
rules, `type: 'app'` the application rule set, and `test: true` lints `src/App.test.tsx`.

It is also the React half of the React-family pair: the same `react: true` emits the same three
React Config objects in the [`next`](../next/README.md) example, and only that one adds Next objects.

Predecessor: **canonical consumer, no starter snapshot.** There is no React starter to take a
snapshot of, so the previous configuration below is the shape a React project in this ecosystem has
today when it calls `antfu()` directly. Written 2026-10-18.

## Previous configuration

```js
// eslint.config.js
import { antfu } from '@antfu/eslint-config'
import oxlint from 'eslint-plugin-oxlint'

export default antfu(
  {
    react: true,
    unocss: true,
  },
  ...oxlint.buildFromOxlintConfigFile('.oxlintrc.json'),
)
```

```json
// .oxlintrc.json
{
  "$schema": "./node_modules/oxlint/configuration_schema.json",
  "extends": ["./node_modules/@lumirelle/oxlint-config/.oxlintrc.ts.json"]
}
```

## This example's options

```ts
// options.ts
import type { Options } from '@lumirelle/linter-config/eslint'

export const options = {
  type: 'app',
  react: true,
  jsx: true,
  unocss: true,
  test: true,
} satisfies Options
```

Both config files read that module, so ESLint and Oxlint cannot drift by configuration:

```js
// eslint.config.js
import { eslint } from '@lumirelle/linter-config/eslint'
import { options } from './options.ts'

export default eslint(options)
```

```ts
// oxlint.config.ts
import { oxlint } from '@lumirelle/linter-config/oxlint'
import { options } from './options.ts'

export default oxlint(options)
```

## Mapping the old call onto the options module

| Previous config | Here | Why |
| --- | --- | --- |
| `react: true` | kept | Same Module: `@eslint-react/eslint-plugin` and `eslint-plugin-react-refresh`, now declared as the project's own peers. |
| `unocss: true` | kept | `@unocss/eslint-plugin` is a peer on the ESLint side and the `unocss` `jsPlugin` on the Oxlint side. |
| — | `type: 'app'` | The predecessor's default; stated because it is the switch that keeps the library-only rule slices off. |
| — | `jsx: true` | The predecessor had no JSX switch — its React preset already parsed `.tsx`. Here the parser flag is its own Module; the example states it because every source file is JSX or TSX. |
| — | `test: true` | `src/App.test.tsx` is part of the tree; without the flag the vitest rules would not apply to it. |
| `eslint-plugin-oxlint` plus `.oxlintrc.json` | `oxlint.config.ts` | One options module drives both tools, so the Bridge comes from Source instead of a hand-built config file. Delete the `.oxlintrc.json`. |
| `@lumirelle/oxlint-config/.oxlintrc.ts.json` | the package's `oxlint` subpath | The preset plus the broken-out `eslint.config.js` become one file per tool, both reading `options.ts`. |

## Install

The example declares the peers its enabled Modules need:

```sh
npm install -D @lumirelle/linter-config @lumirelle/linter-plugins-eslint @lumirelle/linter-plugins-oxlint \
  eslint oxlint @eslint-react/eslint-plugin eslint-plugin-react-refresh @unocss/eslint-plugin
```

There is no `.oxlintrc.json` to keep: `oxlint.config.ts` is discovered without a `-c` flag, and
Oxlint refuses to load when both files exist in one directory. Delete the old file when migrating.

The runtimes are deliberately **not** installed: the example has no `react`, `react-dom`, `vite` or
`unocss` dependency, so it stays a lint target rather than an application. Nothing the linter does
needs them, but two rules read whether they are present, and a real project notices the difference:
- `react-refresh/only-export-components` allows constant exports only when `vite` is installed. In
  this example it is not, so exporting a non-component constant from a component module is reported;
  in a Vite project the same export is accepted.
- The same rule allows the Next, Remix and React Router route export names when those packages are
  installed. None of them is, which is the difference between this example and
  [`next`](../next/README.md).

The one UnoCSS file the example does keep is `uno.config.ts`, without presets: `@unocss/eslint-plugin`
refuses to order class names without a config file, and the file imports nothing, because the preset
packages are the runtimes the example does not install. The [`vue`](../vue/README.md) and
[`nuxt`](../nuxt/README.md) examples ship the same file for the same reason.

A Vite project also has a `vite.config.ts` next to this file. The example leaves it out because it
would import `vite` and the framework plugin, which are exactly the packages the example does not
install.

## Tree

```text
playground/react/
├── eslint.config.js
├── oxlint.config.ts
├── options.ts
├── package.json
├── tsconfig.json          # extends @lumirelle/tsconfig/ts plus the DOM lib and the JSX runtime
├── uno.config.ts          # no presets: the file `@unocss/eslint-plugin` needs to run at all
└── src/
    ├── App.test.tsx       # the `test` Module's target
    ├── App.tsx            # the component, with the utility classes `unocss` orders
    └── main.tsx           # the entry point, which is why the DOM types are in the tsconfig
```
