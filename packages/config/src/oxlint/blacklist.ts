import type { PluginId } from '../types'

/**
 * A Plugin this Source refuses to hand to Oxlint, with the failure observed against the
 * installed Oxlint.
 */
export interface BlacklistEntry {
  id: PluginId
  /** What goes wrong, and what it costs, as observed with the installed Oxlint. */
  failure: string
}

/**
 * Plugins that cannot be used safely through Oxlint's `jsPlugins`, so their rules are dropped
 * and reported as `blacklisted-plugin` instead of quietly producing nothing.
 *
 * Every entry must be proven by `packages/config/test/blacklist.test.ts`, which replays the
 * failure through the real Oxlint binary. Remove an entry only after that test stops failing.
 */
export const OXLINT_BLACKLIST: readonly BlacklistEntry[] = [
  {
    id: 'eslint-comments',
    failure:
      '`no-unlimited-disable` throws `RangeError: Line/column pair translates to an out of '
      + "range offset` out of Oxlint's report shim on a block `/* eslint-disable */` directive: on "
      + 'the first line Oxlint reports `Error running JS plugin`, anywhere else the rule silently '
      + 'misses the directive. Only the line-comment form works, so the plugin cannot be trusted to '
      + 'see the block directives it exists for.',
  },
]

/** The blacklist entry for a Plugin id, or `undefined` when Oxlint may load it. */
export function blacklistEntry(id: PluginId): BlacklistEntry | undefined {
  return OXLINT_BLACKLIST.find(entry => entry.id === id)
}
