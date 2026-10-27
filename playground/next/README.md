# `next` example

A Next.js App Router project. `react: true` adds the React Module, `nextjs: true` the Next Module
(`@next/eslint-plugin-next`'s `recommended` set and then its `core-web-vitals` set), `type: 'app'`
the application rule set, and `test: true` lints `app/page.test.tsx`.

It is the second half of the React-family pair: it emits the same three React Config objects as the
[`react`](../react/README.md) example and adds the two Next ones, so the boundary between the React
Module and the Next Module is visible in one Emission.

Predecessor: **canonical consumer, no starter snapshot.** There is no Next starter to take a
snapshot of, so the previous configuration below is the two shapes a Next project has today: the
`antfu()` call plus a `.oxlintrc.json`, and the config `create-next-app` writes. Written 2026-10-18.

## Previous configuration

```js
// eslint.config.js
import { antfu } from '@antfu/eslint-config'
import oxlint from 'eslint-plugin-oxlint'

export default antfu(
  {
    react: true,
    nextjs: true,
  },
  ...oxlint.buildFromOxlintConfigFile('.oxlintrc.json'),
)
```

```js
// eslint.config.mjs — what `create-next-app` writes
import { FlatCompat } from '@eslint/eslintrc'

const compat = new FlatCompat({ baseDirectory: import.meta.dirname })

export default [
  ...compat.extends('next/core-web-vitals', 'next/typescript'),
]
```

## This example's options

```ts
// options.ts
import type { Options } from '@lumirelle/linter-config/eslint'

export const options = {
  type: 'app',
  react: true,
  nextjs: true,
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
| `react: true` | kept | Same React Module as the `react` example: `@eslint-react/eslint-plugin` and `eslint-plugin-react-refresh`, declared as peers. |
| `nextjs: true` | kept | `@next/eslint-plugin-next`, declared as a peer; the Module owns the Next rules. |
| `compat.extends('next/core-web-vitals')` | `nextjs: true` | The Module emits exactly that set — 22 rules, `next/no-html-link-for-pages` and `next/no-sync-scripts` at `error` as the set raises them, the rest at their `recommended` severity. |
| `compat.extends('next/typescript')` | the TypeScript Module, on by default | `typescript-eslint`'s recommended rules come from this package's own Module rather than from the Next config, so no `FlatCompat` layer is needed. |
| `@eslint/eslintrc`'s `FlatCompat` | — | Nothing left to bridge: both config files are flat and both read the same options module. |
| `eslint-plugin-oxlint` plus `.oxlintrc.json` | `oxlint.config.ts` | One options module drives both tools, so the Bridge comes from Source instead of a hand-built config file. Delete the `.oxlintrc.json`. |
| — | `type: 'app'` | The predecessor's default; stated because it is the switch that keeps the library-only rule slices off. |
| — | `test: true` | `app/page.test.tsx` is part of the tree, and the flag is what puts the vitest rules on it. |
| — | `jsx` left off | The React and Next Modules already declare the JSX parser flag for their own files; the `jsx` Module is for a project that has JSX and no React Module. |

## Why the official Next ESLint config is not composed

`eslint-config-next` is not only the Next rules. It is the Next plugin plus `eslint-plugin-react`,
`eslint-plugin-react-hooks`, `eslint-plugin-import`, `eslint-plugin-jsx-a11y`, `typescript-eslint`
and the resolver packages, all bridged through `FlatCompat`. Composing it next to this config goes
wrong in three ways:

- **The Next rules arrive twice.** `nextjs: true` already emits the plugin's `recommended` set and
  then `core-web-vitals`, key for key and severity for severity. Composing the official config adds
  a second copy under its own `@next/next` plugin id, so a violation is reported once per copy.
- **The React rules disagree.** This config registers `@eslint-react/eslint-plugin` as `react`;
  `eslint-config-next` registers `eslint-plugin-react` under the same `react/` prefix. Both set the
  same rule keys, and which plugin actually enforces them depends on which Config object ran last.
- **The compat layer comes back.** `FlatCompat` and `@eslint/eslintrc` exist to bridge a legacy
  config; composing one is what this package is meant to remove.

Compose it only if you need a rule this config does not emit. Today that is `eslint-plugin-jsx-a11y`:
the `jsx` Module is the parser flag alone, so no `jsx-a11y` rule reaches either Emission.

## Adding the official rules back

For the Next rules themselves, `overrides` is the escape hatch. It reaches one Config object of the
Module and lands in both Emissions:

```ts
// options.ts
import type { Options } from '@lumirelle/linter-config/eslint'

export const options = {
  // The rest of this example's options, unchanged.
  type: 'app',
  react: true,
  nextjs: true,
  test: true,
  overrides: {
    // The Config object the Next rules were emitted onto: the same `next/*` keys the official set
    // uses, so a severity here replaces the Module's own in both Emissions.
    'lumirelle/nextjs/rules': {
      rules: {
        // The official set warns; this project runs `--max-warnings 0`, so it asks for an error.
        'next/no-img-element': 'error',
      },
    },
  },
} satisfies Options
```

`overrides` cannot register a plugin, so a rule whose plugin this config never declares — the
`jsx-a11y` gap above — goes through the composer instead:

```js
// eslint.config.js
import { eslint } from '@lumirelle/linter-config/eslint'
import jsxA11y from 'eslint-plugin-jsx-a11y'
import { options } from './options.ts'

// Your own Config objects are appended after the Emission and resolve before the Bridge, which the
// factory appends last: a rule you re-enable is turned off again where Oxlint reports it, and there
// is nothing to re-append.
export default eslint(options).append({
  name: 'project/jsx-a11y',
  files: ['app/**/*.tsx'],
  plugins: { 'jsx-a11y': jsxA11y },
  rules: jsxA11y.flatConfigs.recommended.rules,
})
```

## Install

The example declares the peers its enabled Modules need:

```sh
npm install -D @lumirelle/linter-config @lumirelle/linter-plugins-eslint @lumirelle/linter-plugins-oxlint \
  eslint oxlint @eslint-react/eslint-plugin eslint-plugin-react-refresh @next/eslint-plugin-next
```

There is no `.oxlintrc.json` to keep: `oxlint.config.ts` is discovered without a `-c` flag, and
Oxlint refuses to load when both files exist in one directory. Delete the old file when migrating.

The runtime is deliberately **not** installed: the example has no `next` or `react` dependency, so it
stays a lint target rather than an application. One rule reads whether `next` is present —
`react-refresh/only-export-components` allows the App Router export names (`metadata`,
`generateMetadata`, `revalidate`, ...) only then. This example has no `next`, so `app/layout.tsx`
exports the component alone; in a real project, which always has `next`, the same file keeps the
`metadata` export a route layout normally carries. The same rule allows constant exports only when
`vite` is installed, which is the matching difference from [`react`](../react/README.md).

The Next plugin also warns that `Pages directory cannot be found at <root>/pages` while this tree is
linted: it looks for the legacy `pages` route directory, which an App Router project does not have.
The warning names the rule that wanted it and changes no result.

The example also has no `next.config.ts`: a real project has one, and it would import `next`, which
is exactly the package the example does not install.

## Tree

```text
playground/next/
├── app/
│   ├── about/
│   │   └── page.tsx       # a second route segment
│   ├── layout.tsx         # the root layout of the segment tree
│   ├── page.test.tsx      # the `test` Module's target
│   └── page.tsx           # the index route
├── eslint.config.js
├── oxlint.config.ts
├── options.ts
├── package.json
└── tsconfig.json          # extends @lumirelle/tsconfig/ts plus the DOM lib; Next compiles the JSX
```
