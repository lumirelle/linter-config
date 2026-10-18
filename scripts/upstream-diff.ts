import type { ModuleId, Options } from '../packages/config/src/types'
import { mkdir, writeFile } from 'node:fs/promises'
import { dirname } from 'node:path'
import process from 'node:process'
import { parseArgs } from 'node:util'
import { CONFIG_NAME_PREFIX } from '../packages/config/src/source'
import { readInstalledVersion, readUpstreamPin } from './upstream-pin'

/** The part of a rendered ESLint config the report reads; plugin objects are never compared. */
export interface ComparableConfig {
  name?: string
  rules?: Record<string, unknown>
}

/** A normalized rule severity; anything ESLint would reject is `unknown`. */
export type Severity = 'error' | 'warn' | 'off' | 'unknown'

/** One Config object after prefix normalization, with rules reduced to their severities. */
export interface NormalizedConfig {
  name: string
  module: ModuleId
  rules: Record<string, Severity>
}

export interface RuleChange {
  rule: string
  source?: Severity
  upstream?: Severity
}

export interface ConfigDiff {
  name: string
  module: ModuleId
  status: 'aligned' | 'source-only' | 'upstream-only'
  /** Upstream has the rule and Source does not. */
  added: RuleChange[]
  /** Source has the rule and Upstream does not. */
  removed: RuleChange[]
  /** Both have the rule at a different severity. */
  severityChanged: RuleChange[]
}

export interface ModuleDiff {
  module: ModuleId
  /** Whether Source emits this Module at this option point. */
  implemented: boolean
  configs: ConfigDiff[]
  summary: { added: number, removed: number, severityChanged: number }
}

export interface OptionPointDiff {
  id: string
  sourceOptions: Options
  upstreamOptions: Options
  /** Set when Upstream could not be rendered; the point is then informational only. */
  renderError?: string
  modules: ModuleDiff[]
}

export interface DiffBaseline {
  package: string
  version: string
  tag: string
}

export interface DiffPointInput {
  id: string
  /** The same options object both sides are rendered with. */
  sourceOptions: Options
  /** The same options after gating to the Modules Source implements; see `gateUpstreamOptions`. */
  upstreamOptions: Options
  sourceConfigs: readonly ComparableConfig[]
  upstreamConfigs: readonly ComparableConfig[]
  renderError?: string
}

export interface UpstreamDiffInput {
  baseline: DiffBaseline
  points: readonly DiffPointInput[]
}

export interface UpstreamDiffReport {
  baseline: DiffBaseline
  points: OptionPointDiff[]
}

/** The option key that gates a Module: an `Options` entry that is also a `ModuleId`. */
export type ModuleOption = keyof Options & ModuleId

/**
 * Upstream's `defaultPluginRenaming`, plus the two renames only Source's registry makes
 * (`markdown` to `md`, `sonarjs` to `sonar`) and its two Angular ids. Longest prefixes first.
 */
const PLUGIN_RENAMING: ReadonlyArray<readonly [string, string]> = [
  ['@angular-eslint/template', 'angular-template'],
  ['@angular-eslint', 'angular'],
  ['@typescript-eslint', 'ts'],
  ['@eslint-react', 'react'],
  ['@next/next', 'next'],
  ['@stylistic', 'style'],
  ['import-lite', 'import'],
  ['markdown', 'md'],
  ['sonarjs', 'sonar'],
  ['vitest', 'test'],
  ['yml', 'yaml'],
  ['n', 'node'],
]

const UPSTREAM_CONFIG_NAME_PREFIX = 'antfu/'

/**
 * The option key that turns each Module on; every one of them is also a `ModuleId`.
 *
 * Upstream renders these Modules only when their option is on, so the diff turns off every
 * one Source does not emit: the report never needs Upstream's optional peer plugins and is
 * reproducible without installing them. `gitignore` is not listed because it is data
 * handling: Source folds it into its `ignores` Module and the option passes through.
 */
export const UPSTREAM_MODULE_OPTIONS: readonly ModuleOption[] = [
  'angular',
  'antislop',
  'astro',
  'e18e',
  'formatters',
  'imports',
  'jsdoc',
  'jsonc',
  'jsx',
  'markdown',
  'nextjs',
  'node',
  'perfectionist',
  'pnpm',
  'react',
  'regexp',
  'solid',
  'stylistic',
  'svelte',
  'test',
  'toml',
  'typescript',
  'unicorn',
  'unocss',
  'vue',
  'yaml',
]

/** Upstream names its Config objects after the Module, so the first segment is the Module. */
export function moduleOfConfigName(name: string): ModuleId {
  const normalized = normalizeConfigName(name)
  const rest = normalized.startsWith(CONFIG_NAME_PREFIX)
    ? normalized.slice(CONFIG_NAME_PREFIX.length)
    : normalized
  const module = rest.split('/')[0] ?? rest
  // Source implements Upstream's gitignore support inside its `ignores` Module.
  return (module === 'gitignore' ? 'ignores' : module) as ModuleId
}

/** Config object names are public API; Upstream's `antfu/` prefix becomes `lumirelle/`. */
export function normalizeConfigName(name: string): string {
  return name.startsWith(UPSTREAM_CONFIG_NAME_PREFIX)
    ? `${CONFIG_NAME_PREFIX}${name.slice(UPSTREAM_CONFIG_NAME_PREFIX.length)}`
    : name
}

/** Rewrites a rule key's plugin prefix to the canonical Plugin id, so both sides are comparable. */
export function normalizeRuleKey(key: string): string {
  for (const [prefix, id] of PLUGIN_RENAMING) {
    if (key.startsWith(`${prefix}/`)) {
      return `${id}/${key.slice(prefix.length + 1)}`
    }
  }
  return key
}

/** ESLint accepts `off`/`warn`/`error` and `0`/`1`/`2`; both spellings normalize to a name. */
export function normalizeSeverity(entry: unknown): Severity {
  const severity: unknown = Array.isArray(entry) ? entry[0] : entry
  switch (severity) {
    case 0:
    case 'off':
      return 'off'
    case 1:
    case 'warn':
      return 'warn'
    case 2:
    case 'error':
      return 'error'
    default:
      return 'unknown'
  }
}

/**
 * Normalizes rendered configs for comparison: names and rule prefixes follow Source's
 * vocabulary, plugin objects and non-rule fields are dropped, and configs that share a name
 * merge (later rules win, as they would in ESLint).
 */
export function normalizeConfigs(configs: readonly ComparableConfig[]): NormalizedConfig[] {
  const byName = new Map<string, NormalizedConfig>()

  for (const config of configs) {
    const name = normalizeConfigName(config.name ?? '(unnamed)')
    const existing = byName.get(name) ?? { name, module: moduleOfConfigName(name), rules: {} }
    for (const [key, entry] of Object.entries(config.rules ?? {})) {
      existing.rules[normalizeRuleKey(key)] = normalizeSeverity(entry)
    }
    byName.set(name, existing)
  }

  return [...byName.values()].map(config => ({
    ...config,
    rules: Object.fromEntries(Object.entries(config.rules).sort(([a], [b]) => compareNames(a, b))),
  }))
}

/**
 * Builds the options Upstream renders with under one option point: every Module option is
 * forced off unless Source emits that Module, so the comparison is offline and only covers
 * what Source can already express.
 */
export function gateUpstreamOptions(
  options: Options,
  implementedModules: Iterable<ModuleId>,
): Options {
  const implemented = new Set(implementedModules)
  const gated: Options = { ...options }
  for (const option of UPSTREAM_MODULE_OPTIONS) {
    if (!implemented.has(option)) {
      // `false` is the "off" spelling of every Module option, whether it is a flag or an object.
      Object.assign(gated, { [option]: false })
    }
  }
  return gated
}

/** Compares Source and Upstream per Config object, per Module, per option point. */
export function buildReport(input: UpstreamDiffInput): UpstreamDiffReport {
  return {
    baseline: input.baseline,
    points: input.points.map(buildPoint),
  }
}

function buildPoint(point: DiffPointInput): OptionPointDiff {
  const source = configsByName(point.sourceConfigs)
  const upstream = configsByName(point.upstreamConfigs)
  const implemented = new Set([...source.values()].map(config => config.module))
  const names = [...new Set([...source.keys(), ...upstream.keys()])].sort()

  const modules = new Map<string, ModuleDiff>()
  for (const name of names) {
    const config = diffConfig(name, source.get(name), upstream.get(name))
    const module = modules.get(config.module) ?? {
      module: config.module,
      implemented: implemented.has(config.module),
      configs: [],
      summary: { added: 0, removed: 0, severityChanged: 0 },
    }
    module.configs.push(config)
    module.summary.added += config.added.length
    module.summary.removed += config.removed.length
    module.summary.severityChanged += config.severityChanged.length
    modules.set(config.module, module)
  }

  return {
    id: point.id,
    sourceOptions: point.sourceOptions,
    upstreamOptions: point.upstreamOptions,
    ...(point.renderError === undefined ? {} : { renderError: point.renderError }),
    modules: [...modules.values()].sort((a, b) => compareNames(a.module, b.module)),
  }
}

/** Code-unit comparison, so the report is identical on every machine regardless of locale. */
function compareNames(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0
}

function configsByName(configs: readonly ComparableConfig[]): Map<string, NormalizedConfig> {
  return new Map(normalizeConfigs(configs).map(config => [config.name, config]))
}

function diffConfig(name: string, source: NormalizedConfig | undefined, upstream: NormalizedConfig | undefined): ConfigDiff {
  const module = moduleOfConfigName(name)
  const base = { name, module }

  if (source && upstream) {
    const added: RuleChange[] = []
    const removed: RuleChange[] = []
    const severityChanged: RuleChange[] = []

    for (const [rule, upstreamSeverity] of Object.entries(upstream.rules)) {
      const sourceSeverity = source.rules[rule]
      if (sourceSeverity === undefined) {
        added.push({ rule, upstream: upstreamSeverity })
      }
      else if (sourceSeverity !== upstreamSeverity) {
        severityChanged.push({ rule, source: sourceSeverity, upstream: upstreamSeverity })
      }
    }
    for (const [rule, sourceSeverity] of Object.entries(source.rules)) {
      if (!(rule in upstream.rules)) {
        removed.push({ rule, source: sourceSeverity })
      }
    }

    return { ...base, status: 'aligned', added, removed, severityChanged }
  }

  if (upstream) {
    return {
      ...base,
      status: 'upstream-only',
      added: Object.entries(upstream.rules).map(([rule, severity]) => ({ rule, upstream: severity })),
      removed: [],
      severityChanged: [],
    }
  }

  return {
    ...base,
    status: 'source-only',
    added: [],
    removed: Object.entries(source?.rules ?? {}).map(([rule, severity]) => ({ rule, source: severity })),
    severityChanged: [],
  }
}

/** Renders the report as Markdown that a reviewer can read as-is. */
export function renderReport(report: UpstreamDiffReport): string {
  const lines: string[] = [
    '# Upstream diff',
    '',
    `- Upstream: \`${report.baseline.package}\` **${report.baseline.version}** (submodule tag \`${report.baseline.tag}\`)`,
    '- Source: `@lumirelle/linter-config` ESLint Emission',
    '- Command: `mise run upstream:diff`',
    '',
    '## How to read this report',
    '',
    'The report is informational: `mise run upstream:diff` exits 0 even when there are',
    'differences. Only `mise run upstream:check` fails, and only when the pinned submodule tag',
    'and the installed npm package disagree.',
    '',
    'Config objects are aligned by name (`antfu/` is renamed to `lumirelle/`), and rule keys',
    'are aligned by their normalized plugin prefix: every rename Upstream\'s',
    '`defaultPluginRenaming` applies, plus the two Source makes by itself (`markdown` to `md`,',
    '`sonarjs` to `sonar`).',
    '',
    '- `added`: Upstream has the rule and Source does not.',
    '- `removed`: Source has the rule and Upstream does not.',
    '- `severity-changed`: both have the rule, but at a different severity. Rule options are not compared.',
    '',
    'A Module marked **not yet implemented in Source** is ported work, not drift: Source does',
    'not emit that Module yet, so its upstream rules are listed under `added`.',
    '',
    'Upstream renders with every optional Module off except the ones Source implements, so the',
    'report needs no optional peer plugins and runs offline. Each point lists the effective',
    'options on both sides.',
    '',
    '## Summary',
    '',
    '| Option point | Modules | Not yet implemented | Added | Removed | Severity changed |',
    '| --- | --- | --- | --- | --- | --- |',
  ]

  for (const point of report.points) {
    lines.push(summaryRow(point))
  }
  lines.push('')

  for (const point of report.points) {
    lines.push(...renderPoint(point))
  }

  return `${lines.join('\n').trimEnd()}\n`
}

function summaryRow(point: OptionPointDiff): string {
  const notImplemented = point.modules.filter(module => !module.implemented).length
  const totals = point.modules.reduce(
    (sum, module) => ({
      added: sum.added + module.summary.added,
      removed: sum.removed + module.summary.removed,
      severityChanged: sum.severityChanged + module.summary.severityChanged,
    }),
    { added: 0, removed: 0, severityChanged: 0 },
  )

  return `| \`${point.id}\` | ${point.modules.length} | ${notImplemented} | ${totals.added} | ${totals.removed} | ${totals.severityChanged} |`
}

function renderPoint(point: OptionPointDiff): string[] {
  const lines: string[] = [
    `## \`${point.id}\``,
    '',
    'Source options:',
    '',
    '```json',
    JSON.stringify(point.sourceOptions, null, 2),
    '```',
    '',
    'Upstream options:',
    '',
    '```json',
    JSON.stringify(point.upstreamOptions, null, 2),
    '```',
    '',
  ]

  if (point.renderError !== undefined) {
    lines.push(`**Upstream could not be rendered at this option point:** ${point.renderError}`, '')
    return lines
  }

  for (const module of point.modules) {
    lines.push(...renderModule(module), '')
  }

  return lines
}

function renderModule(module: ModuleDiff): string[] {
  const title = module.implemented
    ? `### \`${module.module}\` — implemented in Source`
    : `### \`${module.module}\` — module not yet implemented in Source`
  const lines: string[] = [
    title,
    '',
    `Config objects: ${module.configs.length} · Added: ${module.summary.added} · Removed: ${module.summary.removed} · Severity changed: ${module.summary.severityChanged}`,
  ]

  for (const config of module.configs) {
    lines.push('', `#### \`${config.name}\``, '')
    lines.push(...renderConfig(config))
  }

  return lines
}

function renderConfig(config: ConfigDiff): string[] {
  if (config.status === 'upstream-only') {
    if (config.added.length === 0) {
      return ['Source does not emit this Config object; it has no rules.']
    }
    return ['Source does not emit this Config object; every rule it sets is `added`.', '', ...renderRuleTable(config)]
  }
  if (config.status === 'source-only') {
    if (config.removed.length === 0) {
      return ['Upstream does not emit this Config object; it has no rules.']
    }
    return ['Upstream does not emit this Config object; every rule it sets is `removed`.', '', ...renderRuleTable(config)]
  }
  if (config.added.length === 0 && config.removed.length === 0 && config.severityChanged.length === 0) {
    return ['No rule differences.']
  }
  return renderRuleTable(config)
}

function renderRuleTable(config: ConfigDiff): string[] {
  const lines = [
    '| Change | Rule | Source | Upstream |',
    '| --- | --- | --- | --- |',
  ]

  for (const [change, rules] of [
    ['added', config.added],
    ['severity-changed', config.severityChanged],
    ['removed', config.removed],
  ] as const) {
    for (const rule of rules) {
      lines.push(`| ${change} | \`${rule.rule}\` | ${rule.source ?? '—'} | ${rule.upstream ?? '—'} |`)
    }
  }

  return lines
}

/** One option point fed to both sides of the comparison. */
export interface OptionPointDefinition {
  id: string
  options: Options
}

/**
 * The three option points: Source's defaults, Upstream's full-on preset, and its full-off
 * preset. The defaults point passes `stylistic: false` explicitly because that is Source's
 * documented default and both sides must run the same options.
 */
export function optionPoints(fullOn: Readonly<object>, fullOff: Readonly<object>): OptionPointDefinition[] {
  return [
    { id: 'defaults', options: { stylistic: false, isInEditor: false } },
    { id: 'full-on', options: { ...fullOn, isInEditor: false } },
    { id: 'full-off', options: { ...fullOff, isInEditor: false } },
  ]
}

interface DiffCli {
  out: string
}

/** Parses the CLI arguments; only `--out` is accepted. */
export function parseCli(argv: readonly string[]): DiffCli {
  const { values } = parseArgs({
    args: [...argv],
    options: {
      out: { type: 'string', short: 'o', default: 'reports/upstream-diff.md' },
    },
    strict: true,
  })

  return { out: values.out }
}

/**
 * Renders both sides at every option point and writes the report. A failure to render
 * Upstream is recorded per option point, never as an exit code: the report is informational.
 */
export async function main(argv: readonly string[] = process.argv.slice(2)): Promise<number> {
  const { out } = parseCli(argv)
  const pin = await readUpstreamPin()
  const installedVersion = await readInstalledVersion(pin.package)
  const baseline = { package: pin.package, version: installedVersion ?? pin.version, tag: pin.tag }

  const { antfu, CONFIG_PRESET_FULL_OFF, CONFIG_PRESET_FULL_ON } = await import('@antfu/eslint-config')
  const { eslint } = await import('@lumirelle/linter-config/eslint')

  const points: DiffPointInput[] = []
  for (const point of optionPoints(CONFIG_PRESET_FULL_ON, CONFIG_PRESET_FULL_OFF)) {
    const sourceConfigs = await eslint(point.options) as ComparableConfig[]
    const implementedModules = normalizeConfigs(sourceConfigs).map(config => config.module)
    const upstreamOptions = gateUpstreamOptions(point.options, implementedModules)

    try {
      const upstreamConfigs = await antfu(upstreamOptions as Parameters<typeof antfu>[0]) as ComparableConfig[]
      points.push({ id: point.id, sourceOptions: point.options, upstreamOptions, sourceConfigs, upstreamConfigs })
    }
    catch (error) {
      points.push({
        id: point.id,
        sourceOptions: point.options,
        upstreamOptions,
        sourceConfigs,
        upstreamConfigs: [],
        renderError: error instanceof Error ? error.message : String(error),
      })
    }
  }

  const report = buildReport({ baseline, points })
  const markdown = renderReport(report)

  await mkdir(dirname(out), { recursive: true })
  await writeFile(out, markdown, 'utf8')

  const totals = report.points.reduce(
    (sum, point) => ({
      added: sum.added + point.modules.reduce((total, module) => total + module.summary.added, 0),
      removed: sum.removed + point.modules.reduce((total, module) => total + module.summary.removed, 0),
      severityChanged: sum.severityChanged + point.modules.reduce((total, module) => total + module.summary.severityChanged, 0),
    }),
    { added: 0, removed: 0, severityChanged: 0 },
  )

  process.stdout.write(
    `Upstream diff written to ${out}: ${totals.added} added, ${totals.removed} removed, ${totals.severityChanged} severity-changed across ${report.points.length} option points.\n`,
  )
  return 0
}

if (import.meta.main) {
  process.exitCode = await main()
}
