// @ts-check
import { eslint } from '@lumirelle/linter-config/eslint'

// The repository's own ESLint config, and the reference consumer of
// `@lumirelle/linter-config/eslint`: the package owns every rule, so the only local decisions are
// the ones a consumer genuinely has to make.
export default eslint({
  // A library, not an application: the `node` and `jsdoc` Modules stay on, while Upstream's
  // application-only defaults stay off.
  type: 'lib',
  // Type-aware rules need the project's TypeScript config.
  typescript: { tsconfigPath: 'tsconfig.json' },
  // Run both tools over the same files: the Bridge turns off every rule Oxlint reports, and the
  // object form hands Oxlint its root options — the same ones `oxlint.config.ts` passes.
  oxlint: { typeAware: true, typeCheck: true },
  ignores: [
    // Test fixtures deliberately break house rules to prove that the emitted config reports them.
    'packages/config/test/fixtures/**',
    // The Upstream submodule is a reading baseline, not part of this workspace.
    'upstream/antfu-eslint-config/**',
  ],
})
