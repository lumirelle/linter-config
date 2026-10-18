# `vue` example

A Vue 3 single-page application built the Vite way, with a component tree linted by the Vue Module
and its accessibility sub-option turned on.

There is no starter counterpart. The previous configuration below is a plausible canonical one — the
Vue 3 flat presets plus the accessibility plugin's recommended set, as Vue's own tooling guide puts
them together — not a snapshot of a repository. Source:
[`eslint-plugin-vue` user guide](https://eslint.vuejs.org/user-guide/) and
[Vue's ESLint section](https://vuejs.org/guide/scaling-up/tooling.html#eslint), snapshot taken
2026-10-18.

## Previous configuration

```js
// eslint.config.js
import js from '@eslint/js'
import pluginVue from 'eslint-plugin-vue'
import pluginVueA11y from 'eslint-plugin-vuejs-accessibility'
import tseslint from 'typescript-eslint'

export default [
  js.configs.recommended,
  ...tseslint.configs.recommended,
  ...pluginVue.configs['flat/recommended'],
  ...pluginVueA11y.configs['flat/recommended'],
  {
    files: ['**/*.vue'],
    languageOptions: { parserOptions: { parser: tseslint.parser } },
  },
]
```

## This example's options

```ts
// options.ts
import type { Options } from '@lumirelle/linter-config/eslint'

export const options = {
  type: 'app',
  vue: { a11y: true },
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
| `js.configs.recommended` | omitted | The JavaScript Module is on by default and is what those rules come from. |
| `...tseslint.configs.recommended` | omitted | The TypeScript Module is on by default. The type-aware slice needs `typescript: { tsconfigPath: 'tsconfig.json' }` on both sides, which this example leaves off. |
| `...pluginVue.configs['flat/recommended']` | `vue: { a11y: true }` | The Module emits the Vue 3 chain — `flat/essential`, `flat/strongly-recommended`, `flat/recommended` — as one `lumirelle/vue/rules` object instead of three. |
| `{ files: ['**/*.vue'], languageOptions: { parserOptions: { parser: tseslint.parser } } }` | folded in | The SFC processor, the nested TypeScript parser and `extraFileExtensions: ['.vue']` are already on the Module's own scoped object, so the hand-written block has nothing left to do. |
| `...pluginVueA11y.configs['flat/recommended']` | `vue: { a11y: true }` | The sub-option adds the plugin and its 22 rules to the Vue Module; see below. |
| — | `unocss: true` | UnoCSS class ordering, which a Vite SPA commonly wants; it needs the `@unocss/eslint-plugin` peer. |
| — | `type: 'app'` | The previous config has no such switch; application type keeps the `e18e` Module's default `prefer-static-regex` rule on. |
| — | `test: true` | Upstream reads the `test` Module inline and defaults it on. This snapshot ships no test file — `vitest` and `@vue/test-utils` are not installed — so the option is stated rather than demonstrated. |
| — | `oxlint.config.ts` | A project that had no Oxlint config gains one from the same options object; Vue files are read natively through Oxlint's built-in `vue` scope. |

## What `a11y: true` changes

The sub-option is a Vue Module option, not a Module of its own:

- **A peer becomes required.** `eslint-plugin-vuejs-accessibility` is installed by the project; the
  Module's peer check throws with that package name when `a11y: true` is set and it is missing, so
  the failure names the install rather than the first rule that cannot resolve.
- **A plugin is declared.** `lumirelle/vue/setup` gains `vue-a11y` beside `vue`.
- **Twenty-two rules merge into an existing Config object.** `alt-text`, `aria-props`,
  `click-events-have-key-events`, `no-autofocus`, `tabindex-no-positive` and the rest join
  `lumirelle/vue/rules`. No Config object is added, so `overrides` still address the same name and the
  Emission keeps its shape.
- **They stay ESLint-only.** Oxlint has no built-in counterpart for them, so the Coverage report lists
  them as `no-oxlint-realization` and Oxlint lints the same files with fewer rules.

The contrast with the `nuxt` example is the point: same Vue Module, same Config object names, and the
only difference in the Emission is the `vue-a11y` plugin and the rule keys that start with
`vue-a11y/`.

## Install

```sh
npm install -D @lumirelle/linter-config @lumirelle/linter-plugins-eslint @lumirelle/linter-plugins-oxlint @unocss/eslint-plugin eslint eslint-plugin-vuejs-accessibility oxlint typescript
```

`eslint-plugin-vuejs-accessibility` is the extra peer the accessibility sub-option requires; a Vue
project without `a11y: true` does not install it.

The packages the previous configuration pulled in are no longer direct dependencies. `@eslint/js`,
`eslint-plugin-vue` and `typescript-eslint` are covered by the Plugin Bundles and by the core rule
tables Source carries as data, and `vue-eslint-parser` plus the SFC block processor arrive with the
Bundles as well.

`vue`, `vite` and `unocss` themselves are deliberately absent: this is a lint target, not an
application, and the root dogfood configuration does not lint its source tree either. A real project
also has a `vite.config.ts` and a `uno.config.ts`. The example ships the second one — without
presets, importing nothing — because `@unocss/eslint-plugin` refuses to order class names without a
config file to read. `vite.config.ts` is the file it leaves out, because it would import `vite` and
the Vue plugin, which are exactly the packages the example does not install. The `react` and `nuxt`
examples ship the same `uno.config.ts` for the same reason.

## Tree

```text
playground/vue/
├── eslint.config.js
├── options.ts
├── oxlint.config.ts
├── package.json
├── src/
│   ├── App.vue                  # the SPA root
│   ├── components/
│   │   └── GreetingCard.vue     # a labelled region: what the accessibility rules inspect
│   └── main.ts                  # `createApp(App).mount('#app')`
├── tsconfig.json                # extends @lumirelle/tsconfig/vue; documentation, not built here
├── uno.config.ts                # no presets: the file `@unocss/eslint-plugin` needs to run at all
└── README.md
```
