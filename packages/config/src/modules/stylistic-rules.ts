import type { RuleEntry, RuleKey, StylisticIndent } from '../types'
import type { StylisticIndentPatches, StylisticRulePatch } from './stylistic-rules.generated'
import {
  STYLISTIC_DEFAULT_RULES,
  STYLISTIC_INDENT_LEVEL,
  STYLISTIC_PATCHES,
} from './stylistic-rules.generated'

/** The `customize()` options the `stylistic` Module passes, all of them resolved. */
export interface StylisticCustomizeOptions {
  braceStyle: '1tbs' | 'stroustrup' | 'allman'
  experimental: boolean
  indent: StylisticIndent
  jsx: boolean
  quotes: 'single' | 'double' | 'backtick'
  semi: boolean
}

/** The level `customize()` defaults to, and the one the generated table was computed with. */
const DEFAULT_INDENT_LEVEL = 2

/**
 * `@stylistic/eslint-plugin`'s `configs.customize()` output, composed from generated data.
 *
 * Source imports no plugin package, so the rule table is the committed output of one
 * `customize()` call and each option is a generated patch over it. The patches apply in a fixed
 * order — experimental, JSX, indent, quotes, semi, brace style — because they overlap: the
 * experimental patch turns JSX rules off and the JSX patch removes them, while both the indent
 * and the experimental patches touch rules that only exist while JSX is on. The generator
 * (`mise run //packages/config:stylistic`) asserts that this composition equals `customize()`
 * for every option combination, so an ordering bug cannot survive regeneration.
 */
export function stylisticCustomizeRules(
  options: StylisticCustomizeOptions,
): Partial<Record<RuleKey, RuleEntry>> {
  const rules: Partial<Record<RuleKey, RuleEntry>> = { ...STYLISTIC_DEFAULT_RULES }

  if (options.experimental) {
    applyPatch(rules, STYLISTIC_PATCHES.experimental)
  }
  if (!options.jsx) {
    applyPatch(rules, STYLISTIC_PATCHES.jsx)
  }
  applyIndent(rules, options.indent, options.jsx)
  if (options.quotes !== 'single') {
    applyPatch(rules, STYLISTIC_PATCHES.quotes[options.quotes])
  }
  if (options.semi) {
    applyPatch(rules, STYLISTIC_PATCHES.semi)
  }
  if (options.braceStyle !== 'stroustrup') {
    applyPatch(rules, STYLISTIC_PATCHES.braceStyle[options.braceStyle])
  }

  return rules
}

/**
 * Applies the indent patch that matches the level, then lets the caller's own indent rule options
 * replace the plugin's, which is what `customize()` does with the array form of the option.
 */
function applyIndent(
  rules: Partial<Record<RuleKey, RuleEntry>>,
  indent: StylisticIndent,
  jsx: boolean,
): void {
  const [level, indentOptions] = Array.isArray(indent) ? indent : [indent, undefined]

  if (level !== DEFAULT_INDENT_LEVEL) {
    const patches = level === 'tab'
      ? STYLISTIC_PATCHES.indent.tab
      : withIndentLevel(STYLISTIC_PATCHES.indent.number, level)
    applyPatch(rules, jsx ? patches.withJsx : patches.withoutJsx)
  }

  if (indentOptions) {
    rules['style/indent'] = ['error', level, indentOptions]
  }
}

/** Replaces the level placeholder the generated patches carry with the caller's numeric level. */
function withIndentLevel(patches: StylisticIndentPatches, level: number): StylisticIndentPatches {
  return {
    withJsx: substituteLevel(patches.withJsx, level),
    withoutJsx: substituteLevel(patches.withoutJsx, level),
  }
}

function substituteLevel<T>(value: T, level: number): T {
  if ((value as unknown) === STYLISTIC_INDENT_LEVEL) {
    return level as unknown as T
  }
  if (Array.isArray(value)) {
    return value.map(item => substituteLevel(item, level)) as T
  }
  if (typeof value === 'object' && value !== null) {
    return Object.fromEntries(
      Object.entries(value).map(([key, entry]) => [key, substituteLevel(entry, level)]),
    ) as T
  }
  return value
}

/** A patch replaces the rules it names and removes the ones it sets to `null`. */
function applyPatch(rules: Partial<Record<RuleKey, RuleEntry>>, patch: StylisticRulePatch): void {
  for (const [key, entry] of Object.entries(patch) as Array<[RuleKey, RuleEntry | null | undefined]>) {
    if (entry === null) {
      delete rules[key]
    }
    else if (entry !== undefined) {
      rules[key] = entry
    }
  }
}
