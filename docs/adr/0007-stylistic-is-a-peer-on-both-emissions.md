# `stylistic` is a peer on both Emissions

Both Bundles used to carry `@stylistic/eslint-plugin` by default: the ESLint Bundle shipped it as a regular dependency, because Upstream declares it as one and [ADR 0002](0002-plugin-bundles.md) read "what Upstream ships" as the rule for what a Bundle carries, and the Oxlint Bundle listed `style` in its `jsPlugins` map while shipping none of the packages that map named. The `stylistic` Module is off by default — this project formats with `oxfmt`, which keeps object literals as written, and `@stylistic` would rewrap them — so the install was mandatory for a Module the default Emission never enables.

`style` is now `from: 'peer'`, the way every Module a consumer opts into is. The catalog entry moves from bundle to peer, `@stylistic/eslint-plugin` leaves the ESLint Bundle's `dependencies` and is no longer one of the plugin objects that Bundle re-exports, and it joins the config package's optional peers. The consumer's copy is what both Emissions load: the ESLint Adapter resolves a peer id like any other, and the Oxlint entry keeps its `style` alias and emits the bare package name, because the Bundle does not ship that package ([ADR 0006](0006-the-oxlint-bundle-resolves-its-jsplugins.md)). Enabling the Module therefore costs one install, that one copy serves both tools, and a `style/` rule key cannot name two different implementations.

A consumer who turns `stylistic` on without the package gets the standard peer error naming it: `The "stylistic" Module needs a package this project has not installed: "@stylistic/eslint-plugin". Install it to enable the Module.` The `stylistic` Module is the only thing that asks for the package, so nothing else pays for it.

This supersedes the part of [ADR 0002](0002-plugin-bundles.md) that takes Upstream's dependency shape as what the Bundles carry: whether a Module is on by default decides who installs its plugin, and for a Module that is off, that is the consumer.

Terms are defined in [GLOSSARY.md](../../GLOSSARY.md); the Module itself is described in the [Source schema](../design/source-schema.md), and the emission mechanism the bare specifier travels through is [ADR 0006](0006-the-oxlint-bundle-resolves-its-jsplugins.md).

## Considered Options

- **Keep shipping it in both Bundles.** The install would stay mandatory for a Module the default Emission does not enable, and `stylistic` would be the one Module whose "on" costs nothing — the opposite of what an optional peer means everywhere else.
- **Ship it in the ESLint Bundle only.** A consumer running both tools would then have two copies to keep in step, and the Oxlint Emission would have to reach into the other Bundle's dependency to name the same package, which is a dependency between the Bundles this design does not have.
- **Turn `stylistic` on by default.** It would restore the reason to ship the plugin, and change the formatting output of every existing consumer — a different decision, with consequences well beyond who installs a package.

## Consequences

- A consumer who imports the plugin object from the ESLint Bundle imports `@stylistic/eslint-plugin` directly instead; the Bundle no longer carries it in either export.
- The Oxlint Emission declares `style` as a bare package name: the id is registered and the Bundle does not ship the package, which is [ADR 0006](0006-the-oxlint-bundle-resolves-its-jsplugins.md)'s fallback rule reached by design rather than by absence.
- Enabling the Module fails on one named package, not on a plugin load inside Oxlint or ESLint, because the peer check runs while Source composes — before either Adapter resolves anything.
