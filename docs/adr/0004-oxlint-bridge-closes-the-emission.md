# The Bridge closes the ESLint Emission at resolution time

The Bridge turns off, in ESLint, the rules the Oxlint Emission already reports; its shape is in the [Source schema](../design/source-schema.md). It used to be the tail of the Config objects the ESLint factory itself built, together with an exported Bridge helper that the documentation told consumers to append "last". Both halves were the problem. The position held only until the consumer's next `append` / `insertAfter` / `override`: one `.append({ rules: { 'ts/no-explicit-any': 'error' } })` re-opened a rule Oxlint reports, and nothing failed — the violation was simply reported twice. And "the same options" was prose: the helper took its own options object, so Source could be built twice from two objects that disagreed.

The Bridge is now the last step of the ESLint Emission. When `oxlint` is set, the ESLint Adapter derives it once, inside the same factory call, from the Config objects `source()` already produced, and registers it as the composer's resolution hook. That hook runs after every consumer operation, so the Bridge closes whatever array the consumer resolved: appends, inserts and overrides all land before it, and both Emissions still come from one options object. One switch enables it and there is no second call. The factory owns the position, so ordering stops being a contract the consumer has to keep.

## Considered Options

- **Status quo: a constructor-appended Bridge plus an exported `oxlintBridge()` helper.** The helper is what let a single consumer `.append()` silently re-open a rule, because "append it last" was an instruction rather than a mechanism; it also restated the options object, so Source could be built a second time from a different one. Neither failure produced an error.
- **Implicit only, without a mechanism change.** The Bridge would stay the tail of the factory's own objects, which is exactly as long as it is last: the first consumer append moves it, and the double report comes back with no signal.
- **Explicit only: keep the helper and drop the `oxlint` option.** Every consumer would have to understand flat-config ordering well enough to place the Bridge, and would restate the factory's options in a second object that can drift from the first.
- **Memoize only: cache `source()` per options object.** Removes the second build, not the ordering problem, and two distinct options objects still derive two Sources that can disagree.
- **An exclusion option, i.e. per-rule or per-slice un-bridging.** A second entry point in disguise: it contradicts the goal of one switch, and no current consumer needs it.

## Known limitation: a consumer cannot make ESLint the sole reporter for a slice

The `overrides` option accepts only `rules`, `files` and `ignores` per Config object, so it cannot set a tool field, and `tools.oxlint: false` is the field that would say "this slice is ESLint's alone". The mechanism already exists in Source: the Oxlint Adapter and the Bridge filter on one predicate, so a Config object is either in both Emissions or in neither, and `tools.oxlint: false` is how a Module opts out today. What is missing is a supported way to set it from the factory options. This is recorded as a deferred gap rather than a bug: a consumer can still leave `oxlint` unset and let ESLint report everything, and exposing the field is a separate change with its own shape (a per-object tool override inside `overrides`, or a dedicated option).

## Consequences

- Ordering is no longer a consumer contract: an appended Config object resolves before the Bridge whatever it contains, and a consumer does not need to know flat-config ordering to stay correct.
- The exported `oxlintBridge()` helper left the public surface of `@lumirelle/linter-config/eslint`. A consumer that appended it out of caution deletes the line; there is no replacement, because the Bridge is not a policy the consumer chooses.
- Bridge objects can no longer be addressed by name through the composer (`remove`, `override`). Their names keep the `<Config object>/oxlint-bridge` suffix, so a resolved config dump still shows where a turned-off rule came from.
- The default `.md` ignore folds into the Emission's own Config objects and never the Bridge: it is applied as a default ignore before the hook runs, so a Bridge object carries the `ignores` Source wrote rather than the composer's added glob.
- The README, the GLOSSARY and the Source schema describe one model — set `oxlint` if you also run Oxlint, then append whatever you like, whenever you like — and the schema's Bridge step reads as an Adapter algorithm instead of an export consumers call.
