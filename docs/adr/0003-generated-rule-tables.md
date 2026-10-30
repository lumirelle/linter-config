# Plugin rule tables are committed data, not imports

Some Modules do not own a rule list: `stylistic` is `@stylistic/eslint-plugin`'s `configs.customize()` output under the caller's options, and `regexp` and `e18e` are their plugins' own recommended configs. Source cannot call those APIs, because Source imports no plugin package ([ADR 0001](0001-source-and-composers.md)): a plugin is referenced by Plugin id and resolved by an Adapter, which is what lets an Oxlint Emission exist without any ESLint plugin loaded ([ADR 0002](0002-plugin-bundles.md)). The tables are therefore generated once and committed as TypeScript data under `packages/config/src/modules/*.generated.ts`, together with the Oxlint rule inventory the adapter maps names against. `mise run //packages/config:stylistic`, `//packages/config:plugin-rules` and `//packages/config:inventory` regenerate them from the installed plugins and Oxlint.

Regeneration is a deliberate step, reviewed as a diff: a plugin upgrade that changes a recommended set shows up as generated-file churn plus the emission snapshot that changes with it, and the generator scripts fail if the committed table stops matching the plugin's own output (the stylistic script replays every option combination through the shipped composer).

## What is generated and what is hand-transcribed

The regime above covers the tables a plugin owns: a rule list that only exists as the return value
of a plugin API call (`@stylistic/eslint-plugin`'s `customize()`, `eslint-plugin-regexp`'s
recommended config, `@e18e/eslint-plugin`'s three named sets) and the Oxlint inventory the adapter
maps rule names against. Those are generated, carry the version they were generated from in their
header, and have a drift test:

| Generated file                             | Generator                                 | Source of truth                                                      |
| ------------------------------------------ | ----------------------------------------- | -------------------------------------------------------------------- |
| `src/modules/stylistic-rules.generated.ts` | `mise run //packages/config:stylistic`    | `@stylistic/eslint-plugin`'s `configs.customize()`                   |
| `src/modules/plugin-rules.generated.ts`    | `mise run //packages/config:plugin-rules` | `eslint-plugin-regexp` and `@e18e/eslint-plugin` recommended configs |
| `src/oxlint/inventory.generated.ts`        | `mise run //packages/config:inventory`    | `oxlint --rules --format json`                                       |

Every other table is **hand-transcribed** from Upstream's own source, because there is nothing to
call: Upstream writes those lists as literals, and Source's copy is a transcription of
`upstream/antfu-eslint-config/src/configs/<module>.ts` under the canonical Plugin id prefixes. The
`upstream:diff` report is the drift test for them: a rule Upstream adds or changes shows up as
`added` / `removed` / `severity-changed` against the same options. Hand-transcribed tables are
`javascript`, `typescript`, `imports`, `unicorn`, `node`, `jsdoc`, `test`, `jsx`, `vue`, `nextjs`,
`react`, `solid`, `svelte`, `astro`, `angular`, `unocss`, `perfectionist`, `antfu`, `command`,
`eslint-comments`, `unused-imports`, `antislop`, `jsonc`, `yaml`, `toml`, `markdown`, `pnpm`,
`sort`, `formatters` and `disables`; `pnpm`, `sort` and `disables` transcribe data rather than a
plugin config, and `disables` is derived from what the Modules actually enabled.

A framework Module whose peer plugin publishes its recommended set as data (rather than behind an
API call) stays hand-transcribed on purpose: generating it would add the plugin as a build-time
dependency of a package that only knows it as an optional peer of the consumer.

## Considered Options

- **Import the plugin inside Source**: the shortest path, but it makes those plugins hard dependencies of the config package, breaks the "Source imports no plugin package" invariant, and drags an ESLint plugin into the Oxlint Emission for rules Oxlint reads as plain names.
- **Re-export the tables from a Plugin Bundle**: moves the import, not the dependency: the Oxlint side would still install ESLint plugin objects it never uses, and the rule list would be versioned by the bundle instead of by the config.
- **Generate at build time into `dist`**: the tables would no longer be reviewable in a pull request, and the build would need every bundled plugin installed.

## Consequences

- A plugin upgrade is a two-step change: regenerate the table, then accept the emission snapshot if the new rules are wanted. Neither step can happen silently.
- The generator scripts, not the runtime, are the only place that imports `@stylistic/eslint-plugin`, `eslint-plugin-regexp`, `@e18e/eslint-plugin` or the `oxlint` binary.
- Committed tables carry the version they were generated from in their header, so a stale table is visible in review.
- Options that change a plugin config (`stylistic`'s `customize()` knobs) are committed as per-option patches against the default table, so the table is not duplicated per option combination.
