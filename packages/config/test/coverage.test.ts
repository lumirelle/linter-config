import { expect, it } from 'vitest'
import { coverageReport } from '../src/oxlint/report'

/**
 * The Coverage report is committed as `coverage.json` and compared on every run, so a rule that
 * Oxlint stops implementing, or starts implementing, cannot change what the Oxlint Emission drops
 * without a reviewable diff. Update it deliberately: `vitest run -u test/coverage.test.ts`.
 */
it('records the rules the Oxlint Emission cannot implement', async () => {
  await expect(`${JSON.stringify(coverageReport(), null, 2)}\n`).toMatchFileSnapshot(
    '../coverage.json',
  )
})
