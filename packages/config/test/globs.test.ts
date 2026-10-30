import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
// oxlint-disable-next-line e18e/ban-dependencies
import fastGlob from 'fast-glob'
import { minimatch } from 'minimatch'
import { afterAll, describe, expect, it } from 'vitest'
import {
  assertGlobVocabulary,
  GLOB_ALL_SRC,
  GLOB_ASTRO,
  GLOB_ASTRO_TS,
  GLOB_CSS,
  GLOB_EXCLUDE,
  GLOB_GRAPHQL,
  GLOB_HTML,
  GLOB_JS,
  GLOB_JSON,
  GLOB_JSON5,
  GLOB_JSONC,
  GLOB_JSX,
  GLOB_LESS,
  GLOB_MARKDOWN,
  GLOB_MARKDOWN_CODE,
  GLOB_MARKDOWN_IN_MARKDOWN,
  GLOB_POSTCSS,
  GLOB_SCSS,
  GLOB_SRC,
  GLOB_SRC_EXT,
  GLOB_STYLE,
  GLOB_SVELTE,
  GLOB_SVG,
  GLOB_TESTS,
  GLOB_TOML,
  GLOB_TS,
  GLOB_TSX,
  GLOB_VUE,
  GLOB_XML,
  GLOB_YAML,
} from '../src/globs'

/**
 * Upstream (`@antfu/eslint-config` 9.5.1, `src/globs.ts`) uses extglobs; the brace-only
 * vocabulary must select exactly the same files. Each row is the independent source of truth
 * for the equivalence test below.
 */
const UPSTREAM_EQUIVALENTS: Array<{ upstream: string | string[]; ours: string | string[] }> = [
  { upstream: ['**/*.?([cm])js'], ours: [GLOB_JS] },
  { upstream: ['**/*.?([cm])jsx'], ours: [GLOB_JSX] },
  { upstream: ['**/*.?([cm])ts'], ours: [GLOB_TS] },
  { upstream: ['**/*.?([cm])tsx'], ours: [GLOB_TSX] },
  { upstream: ['**/*.?([cm])[jt]s?(x)'], ours: [GLOB_SRC] },
  { upstream: ['**/*.?([cm])[jt]s?(x)'.replace('**/*.', '*.')], ours: [`*.${GLOB_SRC_EXT}`] },
  { upstream: ['**/*.svelte?(.{js,ts})'], ours: [GLOB_SVELTE] },
  { upstream: ['**/*.y?(a)ml'], ours: [GLOB_YAML] },
  { upstream: ['**/*.htm?(l)'], ours: [GLOB_HTML] },
  { upstream: ['**/*.md/**/*.?([cm])[jt]s?(x)'], ours: [GLOB_MARKDOWN_CODE] },
  { upstream: ['**/auto-import?(s).d.ts'], ours: ['**/auto-import.d.ts', '**/auto-imports.d.ts'] },
  {
    upstream: [
      '**/__tests__/**/*.?([cm])[jt]s?(x)',
      '**/*.spec.?([cm])[jt]s?(x)',
      '**/*.test.?([cm])[jt]s?(x)',
      '**/*.bench.?([cm])[jt]s?(x)',
      '**/*.benchmark.?([cm])[jt]s?(x)',
    ],
    ours: GLOB_TESTS,
  },
]

const FIXTURE_FILES = [
  'src/a.js',
  'src/a.jsx',
  'src/a.cjs',
  'src/a.cjsx',
  'src/a.mjs',
  'src/a.mjsx',
  'src/a.ts',
  'src/a.tsx',
  'src/a.cts',
  'src/a.ctsx',
  'src/a.mts',
  'src/a.mtsx',
  'src/component.svelte',
  'src/component.svelte.js',
  'src/component.svelte.ts',
  'src/data.json',
  'src/data.json5',
  'src/data.jsonc',
  'src/data.yaml',
  'src/data.yml',
  'src/data.toml',
  'src/data.xml',
  'src/data.svg',
  'src/page.htm',
  'src/page.html',
  'src/schema.graphql',
  'src/query.gql',
  'src/styles.css',
  'src/styles.sss',
  'src/styles.less',
  'src/styles.scss',
  'src/styles.pcss',
  'src/styles.postcss',
  'docs/readme.md',
  'docs/page.md/nested/inside.ts',
  'docs/page.md/nested/inside.md',
  'tests/__tests__/unit.ts',
  'tests/unit.spec.ts',
  'tests/unit.test.tsx',
  'tests/unit.bench.mts',
  'tests/unit.benchmark.cts',
  'src/auto-import.d.ts',
  'src/auto-imports.d.ts',
  'src/components.d.ts',
  'app/App.vue',
  'app/page.astro/client.ts',
  '.claude/skills/review.md',
]

const fixture = mkdtempSync(join(tmpdir(), 'lumirelle-globs-'))

afterAll(() => {
  rmSync(fixture, { recursive: true, force: true })
})

for (const file of FIXTURE_FILES) {
  mkdirSync(dirname(join(fixture, file)), { recursive: true })
  writeFileSync(join(fixture, file), '')
}

describe('glob vocabulary', () => {
  it('accepts every exported glob', () => {
    expect(() => assertGlobVocabulary(allGlobs())).not.toThrow()
  })

  it('rejects extglobs, negation and numeric ranges', () => {
    expect(() => assertGlobVocabulary(['**/*.?([cm])js'])).toThrow()
    expect(() => assertGlobVocabulary(['!**/dist'])).toThrow()
    expect(() => assertGlobVocabulary(['src/{1..3}/*.ts'])).toThrow()
  })

  it('reaches the same files as the upstream extglobs in fast-glob', () => {
    for (const { upstream, ours } of UPSTREAM_EQUIVALENTS) {
      expect(fastGlob.sync(ours, { cwd: fixture, dot: true }).sort()).toEqual(
        fastGlob.sync(upstream, { cwd: fixture, dot: true }).sort(),
      )
    }
  })

  it('reaches the same files as the upstream extglobs in minimatch', () => {
    for (const { upstream, ours } of UPSTREAM_EQUIVALENTS) {
      const matches = (patterns: string | string[], file: string): boolean =>
        [patterns].flat().some(pattern => minimatch(file, pattern, { dot: true }))

      expect(FIXTURE_FILES.filter(file => matches(ours, file))).toEqual(
        FIXTURE_FILES.filter(file => matches(upstream, file)),
      )
    }
  })

  it('keeps the exclude list free of the removed tooling paths', () => {
    expect(GLOB_EXCLUDE).toEqual(
      expect.arrayContaining([
        '**/node_modules',
        '**/dist',
        '**/coverage',
        '**/auto-import.d.ts',
        '**/auto-imports.d.ts',
      ]),
    )
  })
})

function allGlobs(): string[] {
  return [
    GLOB_SRC_EXT,
    GLOB_SRC,
    GLOB_JS,
    GLOB_JSX,
    GLOB_TS,
    GLOB_TSX,
    GLOB_STYLE,
    GLOB_CSS,
    GLOB_POSTCSS,
    GLOB_LESS,
    GLOB_SCSS,
    GLOB_JSON,
    GLOB_JSON5,
    GLOB_JSONC,
    GLOB_MARKDOWN,
    GLOB_MARKDOWN_IN_MARKDOWN,
    GLOB_SVELTE,
    GLOB_VUE,
    GLOB_YAML,
    GLOB_TOML,
    GLOB_XML,
    GLOB_SVG,
    GLOB_HTML,
    GLOB_ASTRO,
    GLOB_ASTRO_TS,
    GLOB_GRAPHQL,
    GLOB_MARKDOWN_CODE,
    ...GLOB_TESTS,
    ...GLOB_ALL_SRC,
    ...GLOB_EXCLUDE,
  ]
}
