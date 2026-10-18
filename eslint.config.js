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
    // Test fixtures deliberately break house rules to prove that the emitted config reports them.
    ignores: ['packages/config/test/fixtures/**'],
  },
  ...oxlint.buildFromOxlintConfigFile('.oxlintrc.json'),
)
