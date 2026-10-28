# linter-config

Lumirelle's shared linter configuration: one hand-maintained function graph that derives ESLint and Oxlint artifacts.

## Language

**Source**:
The hand-maintained function graph in this repo, aligned with upstream modules; it takes options, produces Config objects, and is the only input to the adapters. See [ADR 0001](docs/adr/0001-source-and-composers.md) and the [Source schema](docs/design/source-schema.md).
_Avoid_: config, ruleset, preset

**Config object**:
One ESLint-flat-config-shaped item produced by Source, carrying Module metadata and referencing plugins by Plugin id; the shared input of both Adapters.
_Avoid_: block, item, entry

**Module**:
A grouping unit in Source that maps one-to-one to an upstream `configs/*` file; it is both the key for upstream comparison and the key for consumer options.
_Avoid_: section, category

**Domain**:
The file domain of a Config object; it decides which Adapters can consume it.
_Avoid_: target, platform

**Adapter**:
A pure function that turns a sequence of Config objects into one tool's Emission; both sides are exposed as Composers.
_Avoid_: generator, builder, bridge

**Emission**:
An Adapter's output — ESLint flat config, or an Oxlint config object.
_Avoid_: output config, compiled config

**Plugin Bundle**:
A package that only forwards third-party lint dependencies (plugins, parsers, processor glue) and contains no rule semantics. See [ADR 0002](docs/adr/0002-plugin-bundles.md).
_Avoid_: plugin package, dependency bundle

**Plugin id**:
The canonical identifier used for rule prefixes and plugin references in Source, decoupled from npm package names; the [registry](packages/config/src/plugins.ts) is its authoritative list.
_Avoid_: scope, namespace

**Plugin specifier**:
How an Oxlint `jsPlugins` entry names the package behind a Plugin id: a bare package name the consumer installs, or the absolute path a Plugin Bundle resolved from its own copy. See [ADR 0006](docs/adr/0006-the-oxlint-bundle-resolves-its-jsplugins.md).
_Avoid_: plugin path, plugin name

**Bridge**:
A set of Config objects on the ESLint side that turns off rules already handled by Oxlint: one config object per Config object the Oxlint Emission takes, with the same file scopes, closing the ESLint Emission at resolution time. The `oxlint` option is the one way to enable it. Its algorithm is in the [Source schema](docs/design/source-schema.md) and the decision in [ADR 0004](docs/adr/0004-oxlint-bridge-closes-the-emission.md).
_Avoid_: interop, disable list

**Coverage report**:
The per-Module list of rules a tool's Emission cannot implement; it changes when upstream changes. The Oxlint one is committed at [`packages/config/coverage.json`](packages/config/coverage.json).
_Avoid_: unsupported list, gap report

**Upstream**:
`@antfu/eslint-config`, used as the comparison baseline; the pinned tag and versions live in [`upstream/pin.json`](upstream/pin.json), and `mise run upstream:diff` renders the comparison.
_Avoid_: base config, parent config

**Flavor**:
The linter dimension of an example: which tools it configures, and therefore which Emissions it ships. A Flavor and a Stack together identify an example; see [ADR 0005](docs/adr/0005-flavor-first-playground.md).
_Avoid_: variant, mode, preset

**Stack**:
The technology snapshot dimension of an example: the kind of project the Emission is shown against.
_Avoid_: framework, template, scaffold
