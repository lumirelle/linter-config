# The Oxlint Bundle resolves its `jsPlugins` to absolute paths

A project running the Oxlint Emission had to install the packages its `jsPlugins` entries name: six with the default Modules, one more with `stylistic` on. The reason given was that Oxlint resolves a `jsPlugins` entry from the config file's directory. It does not hold. On this repository's `nub` layout the binary is a shim that exports `NODE_PATH` into the store, and elsewhere resolution follows the working directory, so whether an Emission worked was a property of the installer and of whatever happened to be hoisted. When it did not, Oxlint reported `Failed to load JS plugin: <package>` at config parse time rather than an install.

**The Bundle owns resolution.** `@lumirelle/linter-plugins-oxlint` keeps its bare specifier map as data and resolves a Plugin id whose package its own manifest lists as a dependency, returning that package's absolute path and nothing for every other id. The map therefore is no longer the last word on the specifier, and where a plugin is found is one package's answer rather than the installer's. The six packages are regular dependencies of the Bundle, at the same catalog entry the ESLint Bundle uses, and a repository test compares that dependency set with the ids the registry says the Emission loads, so the two cannot drift apart.

**The Emission declares them once, asynchronously.** The single unscoped `jsPlugins` declaration is an awaitable Config object built from a dynamic import of the Bundle, and it stays the first item of the Emission. `oxlint()` remains a synchronous factory returning its Composer, exactly like `eslint()`: the Oxlint composer accepts awaitable inputs, and Oxlint awaits the Emission before it parses it.

**The Bundle is probed synchronously.** The factory resolves the Bundle's specifier before composing, so a missing Bundle throws the install error naming the Bundle from `oxlint()` itself — `Cannot resolve "@lumirelle/linter-plugins-oxlint". Install it in your project.` — instead of surfacing as an ESM resolution failure later. A Bundle that resolves but fails to load repeats the same error from the dynamic import.

**One fallback rule.** A Plugin id whose package the Bundle provides becomes the resolved absolute path; every other id keeps the bare package name, which is the consumer's install: peer plugins, and an id a newer registry knows and this Bundle predates. The rule is not configurable, because the two spellings are the two answers to one question — does the Bundle ship this package — and the Bundle already answers it.

**Render-time normalization is a tooling concern.** The Emission itself stays machine-specific: a resolved path is an install location, so two machines can emit two different Emissions from one options object. What needs a stable spelling is the printed artifact, so the playground runner rewrites every specifier it prints to the package name it points at — the segment after the last `node_modules`, a scope kept with its name. No consumer-facing behaviour depends on the normalized form.

Terms are defined in [GLOSSARY.md](../../GLOSSARY.md); **Plugin specifier** is the spelling this decision is about, where plugin dependencies live is [ADR 0002](0002-plugin-bundles.md), and the id that stays a bare name by decision rather than by absence is [ADR 0007](0007-stylistic-is-a-peer-on-both-emissions.md).

## Considered Options

- **Keep forwarding bare names and have the consumer install the packages.** This is the problem: resolution then belongs to the installer and to hoisting, and the failure arrives from Oxlint at parse time instead of from this package at config load.
- **Resolve from the config package instead.** The config package would have to depend on the plugin packages for that resolution to work, which is what the Bundles exist to prevent; and the `createRequire` path cannot see a package that publishes only an `import` condition, which is why the probe and the resolver both use the ESM one.
- **Make `oxlint()` async.** It would break interchangeability with `eslint()` and force a top-level `await` on `export default oxlint()`, to buy something the composer already supports.
- **An option to choose the spelling per id.** A second behaviour to keep tested, for a question the Bundle's own dependency list already answers; no consumer has asked for the path spelling.

## Consequences

- A consumer installs the Bundle and nothing else for the ids it ships. The peer plugins stay the consumer's install, and a Module that needs one that is missing names the package, as it always has.
- A `jsPlugin` package the Bundle cannot resolve fails the Bundle test — before the fallback turns it into a bare name the consumer never installed.
- An absolute path in the Emission is a fact about the machine that produced it: the playground runner normalizes before printing, and anything else that compares or commits an Emission has to do the same.
- A missing Bundle fails at the factory call; an installed Bundle that fails to load fails when Oxlint awaits the Emission. Both errors name the Bundle, so neither reads as a resolution failure in the consumer's own project.
