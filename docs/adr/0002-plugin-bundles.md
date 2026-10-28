# Plugin dependencies live in two Bundles; language plugins stay with the consumer

The config package has no direct dependency on any third-party lint plugin. `@lumirelle/linter-plugins-eslint` holds the real plugin objects (so the ESLint adapter can resolve Plugin ids); `@lumirelle/linter-plugins-oxlint` holds `jsPlugins` specifiers and the built-in plugin allowlist (Oxlint needs no plugin objects). Both Bundles are optional peers of `@lumirelle/linter-config`, and all three packages release in lockstep.

The Bundles carry exactly the packages Upstream ships as regular `dependencies` that are lint plugins, parsers, or processor glue — except `@stylistic/eslint-plugin`, which is a peer on both Emissions ([ADR 0007](0007-stylistic-is-a-peer-on-both-emissions.md)). Packages Upstream already declares as optional peers stay optional peers of the config package and are installed by the consumer: `@angular-eslint/*`, `@eslint-react/eslint-plugin`, `@next/eslint-plugin-next`, `@prettier/plugin-xml`, `@unocss/eslint-plugin`, `astro-eslint-parser`, `eslint-plugin-astro`, `eslint-plugin-erasable-syntax-only`, `eslint-plugin-format`, `eslint-plugin-jsx-a11y`, `eslint-plugin-react-refresh`, `eslint-plugin-slop`, `eslint-plugin-solid`, `eslint-plugin-sonarjs`, `eslint-plugin-svelte`, `eslint-plugin-vuejs-accessibility`, `prettier-plugin-astro`, `prettier-plugin-slidev`, `svelte-eslint-parser`. The Plugin id registry records where each id comes from (`bundle` or `peer`); enabling a Module whose plugins are peer-provided fails with an error naming the packages to install.

Source references plugins only by Plugin id. The ESLint adapter swaps ids for Bundle objects (or the consumer's own copy, for peer ids); the Oxlint adapter drops `plugins` and derives the built-in plugin list and `jsPlugins` from ids. A `jsPlugins` alias always equals the Plugin id, so supported rule keys are literally identical in both tools; aliases are checked against the reserved names.

Terms are defined in [GLOSSARY.md](../../GLOSSARY.md); the registry that records each Plugin id's source is `packages/config/src/plugins.ts`, described in the [Source schema](../design/source-schema.md), and the composer shape this decision plugs into is [ADR 0001](0001-source-and-composers.md).

## Consequences

- A missing package must produce an error naming the package to install, not an ESM resolution failure.
- Every Oxlint gap goes through `jsPlugins`, but `jsPlugins` can only add rules, not parsers/processors, and cannot run type-aware rules: `jsonc` / `yaml` / `toml` / `markdown` and all type-aware rules are ESLint-only and must appear in the Coverage report.
- Known-incompatible plugins go on a blacklist; every `jsPlugins` declaration has a "loads and triggers at least one rule" test, to catch the silent failure where a plugin loads but its rules never run.
- Lockstep versioning means a plugin upgrade always bumps the Bundle. That is the price for eliminating the "which Bundle goes with which config" matrix.
- A peer-provided language Module is opt-in twice: the consumer installs the packages and enables the Module.

## Considered Options

- **Hard dependencies**: installing the config would install every plugin, and "optional" would lose its meaning.
- **One package per plugin / subpaths per language**: finer-grained, but it turns `exports` into a table that changes with upstream; do it when there is a real need.
