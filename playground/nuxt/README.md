# `nuxt` example

A Nuxt 4 application modelled on [`lumirelle/starter-nuxt`](https://github.com/lumirelle/starter-nuxt).
It turns the Vue Module on for a Nuxt-shaped tree (`app/app.vue`, `app/pages/`, `app/components/`),
keeps the UnoCSS Module the starter already used, and enables the `test` Module at application type.

Predecessor snapshot: `lumirelle/starter-nuxt` at commit
[`0255e28`](https://github.com/lumirelle/starter-nuxt/commit/0255e283c822cc45793dda94958b05ea87bf0017)
as of 2026-10-18.

## Previous configuration

```js
// eslint.config.js
import { antfu } from '@antfu/eslint-config'
import oxlint from 'eslint-plugin-oxlint'
import nuxt from './.nuxt/eslint.config.mjs'

export default antfu(
  {
    unocss: true,
    toml: {
      overrides: {
        'toml/array-element-newline': ['error', 'consistent'],
        'toml/array-bracket-spacing': ['error', 'never'],
      },
    },
  },
  /** Don't forget to set `standalone: false` in your Nuxt ESLint module options. */
  nuxt(),
  ...oxlint.buildFromOxlintConfigFile('.oxlintrc.json'),
)
```

```json
// .oxlintrc.json
{
  "$schema": "./node_modules/oxlint/configuration_schema.json",
  "extends": ["./node_modules/@lumirelle/oxlint-config/.oxlintrc.vue.json"],
  "options": {
    "typeAware": true
  },
  "env": {
    "builtin": true,
    "es2026": true,
    "browser": true,
    "node": true
  }
}
```

## This example's options

```ts
// options.ts
import type { Options } from '@lumirelle/linter-config/eslint'

export const options = {
  type: 'app',
  vue: true,
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

| Starter config | Here | Why |
| --- | --- | --- |
| `antfu({ ... }, nuxt(), ...)` | `eslint(options)` | One options object replaces the `antfu()` arguments, and the paired `oxlint.config.ts` reads the same one. |
| `nuxt()` | not composed | The Vue plugin, the TypeScript parser for SFC scripts and the globals those scripts read are what `vue: true` emits; what the generated config adds on top is Nuxt's own auto-imports and rules. Keep the module only deliberately — see below. |
| `unocss: true` | `unocss: true` | The same Module, now also covering the Oxlint side; it needs the `@unocss/eslint-plugin` peer. |
| `toml: { overrides: { ... } }` | omitted | The `toml` Module is on by default and carries its recommended rules; the starter's two stylistic overrides are not expressible as an option. Re-add them through `overrides: { 'lumirelle/toml/rules': { rules: { ... } } }` if the project formats TOML with ESLint. |
| `...oxlint.buildFromOxlintConfigFile('.oxlintrc.json')` | `oxlint.config.ts` | The second Emission comes from the same Source instead of from a bridge over a hand-written file, and needs no `.oxlintrc.json` at all. |
| `.oxlintrc.json` | deleted | Oxlint refuses to load when both `oxlint.config.ts` and `.oxlintrc.json` exist in one directory. Delete it in the same commit as the migration. |
| `.oxlintrc.json` `extends: ['@lumirelle/oxlint-config/.oxlintrc.vue.json']` | `vue: true` | The Vue Domain maps onto Oxlint's built-in `vue` scope, so the Vue preset is no longer a file to extend. |
| `.oxlintrc.json` `options: { typeAware: true }` | omitted | Type information in a Nuxt project lives in the generated `.nuxt/` project files. Add `oxlint: { typeAware: true }` together with `oxlint-tsgolint`, and a `typescript.tsconfigPath`, to turn it back on. |
| — | `type: 'app'` | The starter never states it. The `e18e` Module reads it — application type keeps its `prefer-static-regex` rule on — and the example states it because that choice is part of the options object. |
| — | `test: true` | Upstream reads the `test` Module inline and defaults it on; the starter lints a `@nuxt/test-utils` suite. This snapshot ships no test file — the runners are not installed — so the option is stated rather than demonstrated. |

Neither Emission carries the Bridge: the example does not set `oxlint: true`, so ESLint still reports
the rules Oxlint reports. Add it (as the `ts` example does) if the project wants each violation
reported once.

## The generated Nuxt ESLint config is deliberately not composed

`@nuxt/eslint` writes `./.nuxt/eslint.config.mjs` during `nuxt prepare`, and the starter spreads its
default export into `antfu(...)`. This example does not import it, because everything the Nuxt-shaped
tree needs — Vue single-file components, their TypeScript scripts, the globals those scripts read —
already comes from `vue: true`. Where the two would overlap, `vue: true` is the single place the Vue
options are set.

Keeping it is possible, and the cost is worth stating before you choose:

- The file exists only after `nuxt prepare` (starting the dev server or building does it too), so
  linting gains a build step this configuration otherwise does not have.
- `@nuxt/eslint`'s `standalone: false` mode is exactly "append me after another config", so the
  composition is `eslint(options).append(nuxt())`. Flat config is last-wins: the generated objects
  come after this Emission and their severities win.
- The generated objects carry no Module and no Domain, so the Oxlint Emission has no counterpart for
  the Nuxt-specific rules and the Bridge cannot see them. Oxlint would lint with fewer rules than
  ESLint unless those rules are added by hand.

```js
// eslint.config.js, if the Nuxt ESLint config is kept
import { eslint } from '@lumirelle/linter-config/eslint'
import nuxt from './.nuxt/eslint.config.mjs'
import { options } from './options.ts'

export default eslint(options).append(nuxt())
```

## Install

The example declares the peers its Modules need; a project migrating from the starter installs the
same ones and drops the packages the removed config files used:

```sh
npm install -D @lumirelle/linter-config @lumirelle/linter-plugins-eslint @lumirelle/linter-plugins-oxlint @unocss/eslint-plugin eslint oxlint typescript
npm uninstall @antfu/eslint-config eslint-plugin-oxlint @lumirelle/oxlint-config @unocss/eslint-config
```

Keep `@nuxt/eslint` only if you compose the generated config as above. There is no `.oxlintrc.json`
to keep: `oxlint.config.ts` is discovered without a `-c` flag.

`nuxt`, `vue`, `vite` and `unocss` themselves are deliberately absent: this is a lint target, not an
application, and the root dogfood configuration does not lint its source tree either. A real project
also keeps a `uno.config.ts`; the example ships one — without presets, importing nothing — because
`@unocss/eslint-plugin` refuses to order class names without a config file to read. The runtime is
what stays absent. The `react` and `vue` examples ship the same file for the same reason.

## Tree

```text
playground/nuxt/
├── app/
│   ├── app.vue              # the application root
│   ├── components/
│   │   └── CounterCard.vue
│   └── pages/
│       └── index.vue        # uses Nuxt's auto-imported `ref`, which the Vue Module declares global
├── eslint.config.js
├── nuxt.config.ts           # build config; Nuxt is not installed, so nothing resolves or lints it
├── options.ts
├── oxlint.config.ts
├── package.json
├── tsconfig.json            # extends @lumirelle/tsconfig/vue; documentation, not built here
├── uno.config.ts            # no presets: the file `@unocss/eslint-plugin` needs to run at all
└── README.md
```

A real Nuxt project's `tsconfig.json` references the generated `.nuxt/tsconfig.*.json` project files
instead of extending a preset, which is only possible after `nuxt prepare`; this snapshot extends the
Vue preset so it stays loadable.
