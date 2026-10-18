// @ts-check
import { oxlint } from '@lumirelle/linter-config/oxlint'

// The repository's own Oxlint config: the same Source as `eslint.config.js`, emitted for
// Oxlint. Oxlint discovers this file without a `-c` flag, which is why `hk` needs no extra
// arguments and why `.oxlintrc.json` had to go — Oxlint refuses to load both.
export default oxlint({
  oxlint: { typeAware: true, typeCheck: true },
  ignores: [
    // Test fixtures deliberately break house rules to prove that the emitted config reports them.
    'packages/config/test/fixtures/**',
    // The Upstream submodule is a reading baseline, not part of this workspace.
    'upstream/antfu-eslint-config/**',
  ],
})
