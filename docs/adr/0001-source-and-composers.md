# Source is a function graph; both artifacts go through a Composer

The shared configuration is a hand-written function graph: each Module is an `(options) => ConfigObject[]`, with module boundaries and option shapes mirroring Upstream. A Config object is plain ESLint-flat-config-shaped data that references plugins by Plugin id. The ESLint adapter resolves Plugin ids to real plugin objects and hands the result to `eslint-flat-config-utils`' `FlatConfigComposer`; the Oxlint adapter maps rule names and strips ESLint-only fields before handing the result to `oxlint-flat-config`'s composer. Both sides expose a Composer, so consumers compose with `append` / `override` instead of editing our source.

Comparison with Upstream renders both sides under the same options and aligns them by `name`. `name` is therefore public API and cannot be renamed once published.

Terms are defined in [GLOSSARY.md](../../GLOSSARY.md); the field-level shape, invariants and adapter algorithms are in the [Source schema](../design/source-schema.md), and where plugin dependencies live is [ADR 0002](0002-plugin-bundles.md).

## Considered Options

- **Generated static config** (like the old `@lumirelle/oxlint-config`): cannot express option-derived rules and gives consumers no way to override parts while keeping defaults.
- **A custom intermediate layer (Block)**: ESLint flat config is already the shared language of both tools; another layer would just be a second name for the same data.
- **Wrapping `@antfu/eslint-config` directly**: no control over rules or plugin references, and no Oxlint artifact.

## Consequences

- Shared globs must be accepted by both minimatch and fast-glob: only `*`, `**`, `{a,b}`, and character classes; no extglobs or `{1..3}`.
- ESLint-only fields (`languageOptions`, `linterOptions`, `processor`) live under `tools.eslint`; Oxlint-only fields under `tools.oxlint`.
- Both sides are thenable and are exported directly: Oxlint awaits the default export before validating it, so `export default oxlint()` needs no top-level `await` and stays symmetric with the ESLint side.
- Rules a tool cannot implement are handled by automatic trimming plus a committed Coverage report, not by hand-written per-rule markers.
