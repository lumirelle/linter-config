import type { ESLint } from 'eslint'
import type { StylisticRulePatch } from '../src/modules/stylistic-rules.generated'
import type { RuleEntry, RuleKey } from '../src/types'
import { spawnSync } from 'node:child_process'
import { writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'
import stylistic from '@stylistic/eslint-plugin'

/**
 * Writes the committed stylistic rule table and its per-option patches from the installed
 * `@stylistic/eslint-plugin`.
 *
 * Run it with `mise run //packages/config:stylistic`. Source imports no plugin package, so the
 * table `configs.customize()` composes is generated here once and each customization option is
 * committed as the patch that option makes to it. The script then replays every option
 * combination through the shipped composer and fails on the first rule where the composition
 * disagrees with `customize()`, which is what keeps the generated data and the plugin in step.
 */
const TARGET = fileURLToPath(new URL('../src/modules/stylistic-rules.generated.ts', import.meta.url))
const REPOSITORY_ROOT = fileURLToPath(new URL('../../../', import.meta.url))

/** The `customize()` options Upstream's `StylisticConfigDefaults` pins. */
const HOUSE = {
  braceStyle: 'stroustrup',
  experimental: false,
  indent: 2,
  jsx: true,
  pluginName: 'style',
  quotes: 'single',
  semi: false,
} as const

/** The level the numeric indent patch is probed with, then replaced by a placeholder. */
const INDENT_PROBE = 4

/** The level placeholder the generated patches carry, mirrored by the composer. */
const INDENT_LEVEL = '<indent>'

type RuleTable = Record<RuleKey, RuleEntry>

/** `customize()` with the house defaults and the given overrides, as a plain rule table. */
function customize(overrides: Parameters<typeof stylistic.configs.customize>[0] = {}): RuleTable {
  const config = stylistic.configs.customize({ ...HOUSE, ...overrides })
  return config.rules as RuleTable
}

/** The change that turns `from` into `to`: whole entries replaced, absent ones removed. */
function diff(from: RuleTable, to: RuleTable): StylisticRulePatch {
  const patch: StylisticRulePatch = {}
  for (const key of (Object.keys(to) as RuleKey[]).sort()) {
    if (JSON.stringify(from[key]) !== JSON.stringify(to[key])) {
      patch[key] = to[key]
    }
  }
  for (const key of (Object.keys(from) as RuleKey[]).sort()) {
    if (!(key in to)) {
      patch[key] = null
    }
  }
  return patch
}

const defaults = customize()

const experimental = diff(defaults, customize({ experimental: true }))
// Computed after the experimental patch, because turning the experimental rules on flips JSX rules
// the JSX patch then has to remove as well.
const jsx = diff(customize({ experimental: true }), customize({ experimental: true, jsx: false }))

const patches: {
  braceStyle: Record<'1tbs' | 'allman', StylisticRulePatch>
  experimental: StylisticRulePatch
  indent: {
    number: { withJsx: StylisticRulePatch, withoutJsx: StylisticRulePatch }
    tab: { withJsx: StylisticRulePatch, withoutJsx: StylisticRulePatch }
  }
  jsx: StylisticRulePatch
  quotes: Record<'backtick' | 'double', StylisticRulePatch>
  semi: StylisticRulePatch
} = {
  braceStyle: {
    '1tbs': diff(defaults, customize({ braceStyle: '1tbs' })),
    'allman': diff(defaults, customize({ braceStyle: 'allman' })),
  },
  experimental,
  indent: {
    number: {
      withJsx: withLevelPlaceholder(diff(defaults, customize({ indent: INDENT_PROBE }))),
      withoutJsx: withLevelPlaceholder(diff(customize({ jsx: false }), customize({ indent: INDENT_PROBE, jsx: false }))),
    },
    tab: {
      withJsx: diff(defaults, customize({ indent: 'tab' })),
      withoutJsx: diff(customize({ jsx: false }), customize({ indent: 'tab', jsx: false })),
    },
  },
  jsx,
  quotes: {
    backtick: diff(defaults, customize({ quotes: 'backtick' })),
    double: diff(defaults, customize({ quotes: 'double' })),
  },
  semi: diff(defaults, customize({ semi: true })),
}

writeFileSync(TARGET, render(pluginVersion()))
format(TARGET)

// The composer reads the file just written, so the assertion below checks the committed data and
// the shipped composition together rather than a copy of either.
const { stylisticCustomizeRules } = await import('../src/modules/stylistic-rules')
assertComposition()

/** Replaces the probed level with the placeholder the composer substitutes the caller's level into. */
function withLevelPlaceholder(value: unknown): StylisticRulePatch {
  return replaceLevel(value) as StylisticRulePatch
}

function replaceLevel(value: unknown): unknown {
  if (value === INDENT_PROBE) {
    return INDENT_LEVEL
  }
  if (Array.isArray(value)) {
    return value.map(item => replaceLevel(item))
  }
  if (typeof value === 'object' && value !== null) {
    return Object.fromEntries(Object.entries(value).map(([key, entry]) => [key, replaceLevel(entry)]))
  }
  return value
}

/**
 * Formats the generated file with the repository's own ESLint, so a regeneration lands exactly the
 * file the lint gate accepts instead of a second, differently formatted copy of the same data.
 */
function format(file: string): void {
  const eslint = join(dirname(createRequire(import.meta.url).resolve('eslint/package.json')), 'bin', 'eslint.js')
  const { status } = spawnSync(process.execPath, [eslint, '--fix', file], { cwd: REPOSITORY_ROOT, stdio: 'inherit' })
  if (status !== 0) {
    throw new Error(`ESLint could not format "${file}"; the generated table is written but not yet lint-clean`)
  }
}

/** The generator records the version it read the table from, so a regeneration names its baseline. */
function pluginVersion(): string {
  const { version } = (stylistic as ESLint.Plugin).meta ?? {}
  if (!version) {
    throw new Error('@stylistic/eslint-plugin declares no `meta.version`, so the generated header cannot name its baseline')
  }
  return version
}

/**
 * Replays every combination through the composer and compares it with `customize()`, so a
 * mismatch is a generation failure instead of a wrong rule table in a consumer's project.
 */
function assertComposition(): void {
  const combinations = {
    braceStyle: ['stroustrup', '1tbs', 'allman'] as const,
    experimental: [false, true] as const,
    indent: [2, 4, 8, 'tab'] as const,
    jsx: [true, false] as const,
    quotes: ['single', 'double', 'backtick'] as const,
    semi: [false, true] as const,
  }

  for (const braceStyle of combinations.braceStyle) {
    for (const experimental of combinations.experimental) {
      for (const indent of combinations.indent) {
        for (const jsx of combinations.jsx) {
          for (const quotes of combinations.quotes) {
            for (const semi of combinations.semi) {
              const options = { braceStyle, experimental, indent, jsx, quotes, semi }
              compare(stylisticCustomizeRules(options), customize(options))
            }
          }
        }
      }
    }
  }
}

function compare(composed: Partial<Record<RuleKey, RuleEntry>>, expected: RuleTable): void {
  const keys = new Set([...Object.keys(composed), ...Object.keys(expected)] as RuleKey[])
  for (const key of keys) {
    const actual = JSON.stringify(composed[key])
    const wanted = JSON.stringify(expected[key])
    if (actual !== wanted) {
      throw new Error(`The composed stylistic table disagrees with customize() at "${key}": ${actual} !== ${wanted}`)
    }
  }
}

function render(version: string): string {
  return `// Generated by \`mise run //packages/config:stylistic\` from @stylistic/eslint-plugin ${version}.
// Do not edit by hand: the table below is one \`configs.customize()\` call —
//   { braceStyle: 'stroustrup', experimental: false, indent: 2, jsx: true, pluginName: 'style', quotes: 'single', semi: false }
// — and every patch is the same call under one option. Source imports no plugin package, so a
// plugin upgrade that changes the recommended set is a deliberate regeneration, reviewable as a
// diff, and the script fails if the composed table stops matching the plugin's own output.
import type { RuleEntry, RuleKey } from '../types'

/** A patch names the rules it replaces; \`null\` removes the rule instead. */
export type StylisticRulePatch = Partial<Record<RuleKey, RuleEntry | null>>

/** The \`customize()\` table for the house defaults, which every patch is relative to. */
export const STYLISTIC_DEFAULT_RULES: Readonly<Record<RuleKey, RuleEntry>> = ${renderValue(defaults, 0)}

/**
 * The placeholder a numeric indent patch carries for the caller's level; the composer substitutes
 * the level into every position it appears in, which is both the rule's level and its \`tabLength\`.
 */
export const STYLISTIC_INDENT_LEVEL = '${INDENT_LEVEL}'

/** The indent patches, per form of the option and per state of the JSX slice. */
export interface StylisticIndentPatches {
  /** Applied while the JSX slice is on, because \`style/jsx-indent-props\` carries the level too. */
  withJsx: StylisticRulePatch
  /** Applied once the JSX slice is off. */
  withoutJsx: StylisticRulePatch
}

/** The change each \`customize()\` option makes to {@link STYLISTIC_DEFAULT_RULES}. */
export const STYLISTIC_PATCHES: {
  braceStyle: Record<'1tbs' | 'allman', StylisticRulePatch>
  experimental: StylisticRulePatch
  indent: { number: StylisticIndentPatches, tab: StylisticIndentPatches }
  jsx: StylisticRulePatch
  quotes: Record<'backtick' | 'double', StylisticRulePatch>
  semi: StylisticRulePatch
} = ${renderValue(patches, 0)}
`
}

/** Serializes generated data as TypeScript, wrapping a value once it would overrun a line. */
function renderValue(value: unknown, column: number): string {
  const inline = inlineValue(value)
  if (column + inline.length <= 80 || typeof value !== 'object' || value === null) {
    return inline
  }

  const pad = ' '.repeat(column + 2)
  const close = ' '.repeat(column)
  if (Array.isArray(value)) {
    const items = value.map(item => `${pad}${renderValue(item, column + 2)}`)
    return `[\n${items.join(',\n')},\n${close}]`
  }
  const entries = Object.entries(value).map(([key, entry]) => {
    const label = `${keyLiteral(key)}: `
    return `${pad}${label}${renderValue(entry, column + 2 + label.length)}`
  })
  return `{\n${entries.join(',\n')},\n${close}}`
}

function inlineValue(value: unknown): string {
  if (typeof value === 'string') {
    return `'${value.replaceAll('\\', '\\\\').replaceAll('\'', '\\\'')}'`
  }
  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value)
  }
  if (value === null) {
    return 'null'
  }
  if (Array.isArray(value)) {
    return `[${value.map(inlineValue).join(', ')}]`
  }
  if (typeof value === 'object' && value !== null) {
    const entries = Object.entries(value).map(([key, entry]) => `${keyLiteral(key)}: ${inlineValue(entry)}`)
    return `{ ${entries.join(', ')} }`
  }
  throw new TypeError(`Cannot serialize ${typeof value} into the generated stylistic table`)
}

function keyLiteral(key: string): string {
  return /^[A-Za-z_$][\w$]*$/u.test(key) ? key : `'${key}'`
}
