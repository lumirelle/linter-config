import type { Glob } from './types'

/**
 * The glob vocabulary shared by ESLint and Oxlint.
 *
 * ESLint reads glob patterns with minimatch and Oxlint with fast-glob,
 * so they are written as brace alternations instead:
 * only `*`, `**`, `{a,b}` and character classes survive in both engines.
 */

export const GLOB_SRC_EXT = '{js,jsx,cjs,cjsx,mjs,mjsx,ts,tsx,cts,ctsx,mts,mtsx}'

export const GLOB_SRC: Glob = `**/*.${GLOB_SRC_EXT}`

export const GLOB_JS: Glob = '**/*.{js,cjs,mjs}'
export const GLOB_JSX: Glob = '**/*.{jsx,cjsx,mjsx}'
export const GLOB_TS: Glob = '**/*.{ts,cts,mts}'
export const GLOB_TSX: Glob = '**/*.{tsx,ctsx,mtsx}'

export const GLOB_STYLE: Glob = '**/*.{c,le,sc}ss'
export const GLOB_CSS: Glob = '**/*.css'
export const GLOB_POSTCSS: Glob = '**/*.{p,post}css'
export const GLOB_LESS: Glob = '**/*.less'
export const GLOB_SCSS: Glob = '**/*.scss'

export const GLOB_JSON: Glob = '**/*.json'
export const GLOB_JSON5: Glob = '**/*.json5'
export const GLOB_JSONC: Glob = '**/*.jsonc'

export const GLOB_MARKDOWN: Glob = '**/*.md'
export const GLOB_MARKDOWN_IN_MARKDOWN: Glob = '**/*.md/**/*.md'
export const GLOB_SVELTE: Glob = '**/*.{svelte,svelte.js,svelte.ts}'
export const GLOB_VUE: Glob = '**/*.vue'
export const GLOB_YAML: Glob = '**/*.{yaml,yml}'
export const GLOB_TOML: Glob = '**/*.toml'
export const GLOB_XML: Glob = '**/*.xml'
export const GLOB_SVG: Glob = '**/*.svg'
export const GLOB_HTML: Glob = '**/*.{htm,html}'
export const GLOB_ASTRO: Glob = '**/*.astro'
export const GLOB_ASTRO_TS: Glob = '**/*.astro/*.ts'
export const GLOB_GRAPHQL: Glob = '**/*.{g,graph}ql'

/** Code blocks inside Markdown documents. */
export const GLOB_MARKDOWN_CODE: Glob = `${GLOB_MARKDOWN}/${GLOB_SRC}`

export const GLOB_TESTS: Glob[] = [
  `**/__tests__/**/*.${GLOB_SRC_EXT}`,
  `**/*.{bench,benchmark,spec,test}.${GLOB_SRC_EXT}`,
]

export const GLOB_ALL_SRC: Glob[] = [
  GLOB_SRC,
  GLOB_STYLE,
  GLOB_JSON,
  GLOB_JSON5,
  GLOB_MARKDOWN,
  GLOB_SVELTE,
  GLOB_VUE,
  GLOB_YAML,
  GLOB_XML,
  GLOB_HTML,
]

export const GLOB_EXCLUDE: Glob[] = [
  '**/node_modules',
  '**/dist',
  '**/package-lock.json',
  '**/yarn.lock',
  '**/pnpm-lock.yaml',
  '**/bun.lockb',

  '**/output',
  '**/coverage',
  '**/temp',
  '**/.temp',
  '**/tmp',
  '**/.tmp',
  '**/.history',
  '**/.vitepress/cache',
  '**/.nuxt',
  '**/.next',
  '**/.svelte-kit',
  '**/.vercel',
  '**/.changeset',
  '**/.idea',
  '**/.cache',
  '**/.output',
  '**/.vite-inspect',
  '**/.yarn',

  '**/CHANGELOG*.md',
  '**/LICENSE*',
  '**/*.min.*',
  '**/__snapshots__',

  // Tool temp files
  '**/vite.config.*.timestamp-*',
  '**/auto-import.d.ts',
  '**/auto-imports.d.ts',
  '**/components.d.ts',

  // AI
  '**/.context',
  '**/.claude',
  '**/.agents',
  '**/.*/skills',
]

const FORBIDDEN_CHARACTERS = ['?', '+', '(', ')', '@', '!', '\\'] as const

/** What a glob outside the shared vocabulary uses, or `undefined` when it stays inside it. */
export function globVocabularyViolation(glob: Glob): string | undefined {
  const character = FORBIDDEN_CHARACTERS.find(forbidden => glob.includes(forbidden))
  if (character) {
    return `uses "${character}"`
  }
  if (glob.includes('..')) {
    return 'uses ".."'
  }
  return undefined
}

/**
 * Asserts that every glob stays inside the shared vocabulary (`*`, `**`, `{a,b}` and
 * character classes).
 *
 * Extglobs, negation and brace ranges are rejected: minimatch accepts some of them and
 * fast-glob others, so a glob that uses them silently stops matching in one of the tools.
 */
export function assertGlobVocabulary(globs: readonly Glob[]): void {
  for (const glob of globs) {
    const violation = globVocabularyViolation(glob)
    if (violation) {
      throw new Error(
        `Glob "${glob}" ${violation}; only *, **, {a,b} and character classes are allowed.`,
      )
    }
  }
}
