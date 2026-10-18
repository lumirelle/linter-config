// @ts-check
import { antfu } from '@antfu/eslint-config'
import oxlint from 'eslint-plugin-oxlint'

export default antfu(
  {
    type: 'lib',
    toml: {
      overrides: {
        'toml/array-element-newline': ['error', 'consistent'],
        'toml/array-bracket-spacing': ['error', 'never'],
      },
    },
  },
  {
    ignores: [
      // Test fixtures deliberately break house rules to prove that the emitted config reports them.
      'packages/config/test/fixtures/**',
      // The Upstream submodule is a reading baseline, not part of this workspace.
      'upstream/antfu-eslint-config/**',
    ],
  },
  ...oxlint.buildFromOxlintConfigFile('.oxlintrc.json'),
)
