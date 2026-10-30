# The option types live at the root entry

`Options` was only nameable through a factory's specifier, `@lumirelle/linter-config/eslint` or `@lumirelle/linter-config/oxlint`, although both of those re-export the same declaration from `src/types.ts`. One object configures both Emissions ([ADR 0001](0001-source-and-composers.md)), and a project that runs both tools keeps a single options module — this repository's own is [`config/linter.ts`](../../config/linter.ts) — so naming the type through one tool's subpath said something the design does not: that the options belong to that tool. A project that configures only Oxlint had the same problem in reverse, or wrote its options inline to avoid the import.

The root entry `.` now exports the option types, and nothing else. The factories stay where they were, on `./eslint` and `./oxlint`.

The root entry has no runtime exports: `dist/index.mjs` is `export {}`. That is deliberate, and it is what keeps the entry from pulling an Adapter — importing it resolves no peer and evaluates no ESLint or Oxlint code. The declaration file is the type surface, which is the whole point of the entry.

The factories did not move with the types. Each one returns its own tool's Composer (`FlatConfigComposer` for ESLint, `Composer` for Oxlint) and resolves its own Plugin Bundle, so one specifier exporting both would invite importing a factory the project does not run. A project that runs both tools writes two config files anyway; what it needed to share was the options, and now it can.

Terms are defined in [GLOSSARY.md](../../GLOSSARY.md); the option shapes themselves are in the [Source schema](../design/source-schema.md).

## Considered Options

- **Leave the type on the subpaths.** A shared options module keeps importing it from one tool's specifier, which is the confusion this decision removes.
- **Export both factories from the root as well.** One specifier for everything reads well until a project imports `eslint` from it while running only Oxlint; the factories' Composer types and peer Bundles are per-tool, and the root would also have to load both Adapters to offer them.
- **A types-only root entry** (chosen). One place to name the shared input, no runtime surface to pay for, and the factories stay attached to the tool they emit for.

## Consequences

- `package.json` gains a `.` export, and `tsdown` a third entry, `src/index.ts`. The other two entries keep their output and their API snapshots.
- The root's public API snapshot is the type surface: the same declarations the subpaths re-export, and no factory.
- Importing the root cannot load an Adapter, so a project that only wants the type never pays for either Emission.
- This repository's own options modules, the playground's, and the test helpers import `Options` from the root, which is the dogfood for the documented form.
- `Options.sonarjs` left the type surface in the same change. It never reached `source()`: the `sonar/` rules ride on the `antislop` Module, and the option had been declared by mirroring Upstream's field list rather than by any Emission reading it.
