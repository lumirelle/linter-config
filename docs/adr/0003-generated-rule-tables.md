# Plugin rule tables are committed data, not imports

Some Modules do not own a rule list: `stylistic` is `@stylistic/eslint-plugin`'s `configs.customize()` output under the caller's options, and `regexp` and `e18e` are their plugins' own recommended configs. Source cannot call those APIs, because Source imports no plugin package ([ADR 0001](0001-source-and-composers.md)): a plugin is referenced by Plugin id and resolved by an Adapter, which is what lets an Oxlint Emission exist without any ESLint plugin loaded ([ADR 0002](0002-plugin-bundles.md)). The tables are therefore generated once and committed as TypeScript data under `packages/config/src/modules/*.generated.ts`, together with the Oxlint rule inventory the adapter maps names against. `mise run //packages/config:stylistic`, `//packages/config:plugin-rules` and `//packages/config:inventory` regenerate them from the installed plugins and Oxlint.

Regeneration is a deliberate step, reviewed as a diff: a plugin upgrade that changes a recommended set shows up as generated-file churn plus the emission snapshot that changes with it, and the generator scripts fail if the committed table stops matching the plugin's own output (the stylistic script replays every option combination through the shipped composer).

## Considered Options

- **Import the plugin inside Source**: the shortest path, but it makes those plugins hard dependencies of the config package, breaks the "Source imports no plugin package" invariant, and drags an ESLint plugin into the Oxlint Emission for rules Oxlint reads as plain names.
- **Re-export the tables from a Plugin Bundle**: moves the import, not the dependency: the Oxlint side would still install ESLint plugin objects it never uses, and the rule list would be versioned by the bundle instead of by the config.
- **Generate at build time into `dist`**: the tables would no longer be reviewable in a pull request, and the build would need every bundled plugin installed.

## Consequences

- A plugin upgrade is a two-step change: regenerate the table, then accept the emission snapshot if the new rules are wanted. Neither step can happen silently.
- The generator scripts, not the runtime, are the only place that imports `@stylistic/eslint-plugin`, `eslint-plugin-regexp`, `@e18e/eslint-plugin` or the `oxlint` binary.
- Committed tables carry the version they were generated from in their header, so a stale table is visible in review.
- Options that change a plugin config (`stylistic`'s `customize()` knobs) are committed as per-option patches against the default table, so the table is not duplicated per option combination.
