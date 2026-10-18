# Upstream baseline

Upstream is [`antfu/eslint-config`](https://github.com/antfu/eslint-config).

`pin.json` is the single source of truth for the baseline: the git tag checked out in this
submodule and the npm version the repository installs. The submodule provides the source and
history to read; the exactly pinned npm package is what executes, and both must name the same
release.

| Path | Role |
| --- | --- |
| `upstream/antfu-eslint-config` | Git submodule, checked out at the tag in `pin.json` |
| `upstream/pin.json` | Pinned tag, npm version, and package name |
| `catalog:check` entry in `/package.json` | Exact npm version (`9.5.1`, never a range) |

## Bumping the baseline

1. Read the upstream changelog and the commits between the old and the new tag in the
   submodule.
2. Check out the new tag: `git -C upstream/antfu-eslint-config checkout v<new>`.
3. Update `version` and `tag` in `pin.json`.
4. Set `@antfu/eslint-config` to the exact new version in the root `package.json` `check`
   catalog and run `nub install`.
5. Port Source modules, then run `mise run upstream:diff` and review
   `reports/upstream-diff.md`. The diff is informational; only `mise run upstream:check`
   fails, and only on a mismatch between `pin.json`, the checked-out tag, and the installed
   package.
