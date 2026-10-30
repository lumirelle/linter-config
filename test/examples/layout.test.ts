import type { Example, Flavor } from '../../playground/examples'
import { readdir, readFile } from 'node:fs/promises'
import { dirname, isAbsolute, join, relative, sep } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { pluginPackageName } from '../../playground/specifiers'
import { exampleTables } from './helpers/emission'

/** Where the examples live, so a package name can be read off its directory. */
const PLAYGROUND = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'playground')

/**
 * The files a stack's flavors are allowed to differ in: the two config modules, the options module
 * (present only in the paired flavor, which is the one with two configs to share it), the manifest
 * and the README.
 *
 * Everything else, meaning the source tree, the project file and the stack's own config files,
 * belongs to the stack rather than to the flavor, so it is byte-identical in all three directories.
 */
const FLAVOR_FILES = new Set([
  'README.md',
  'eslint.config.js',
  'options.ts',
  'oxlint.config.ts',
  'package.json',
])

/** The tool packages a flavor installs beyond the shared set every flavor declares. */
const TOOL_PACKAGES: Record<Flavor, readonly string[]> = {
  'eslint': ['@lumirelle/linter-plugins-eslint', 'eslint'],
  'oxlint': ['@lumirelle/linter-plugins-oxlint', 'oxlint'],
  'eslint-oxlint': [
    '@lumirelle/linter-plugins-eslint',
    '@lumirelle/linter-plugins-oxlint',
    'eslint',
    'oxlint',
  ],
}

/** Every package any flavor installs as a tool, which no flavor shares with another. */
const ALL_TOOL_PACKAGES = new Set(Object.values(TOOL_PACKAGES).flat())

/**
 * The plugin packages the Oxlint Plugin Bundle ships: its own `dependencies`, read off its manifest
 * rather than restated here, so the set follows whatever the Bundle takes on.
 *
 * A Bundle-sourced plugin is inlined on the ESLint side, where `@lumirelle/linter-plugins-eslint`
 * depends on the package and re-exports its object, and resolved to a path on the Oxlint side, so no
 * flavor installs one. Every other `jsPlugins` package is an optional peer, which Source's peer check already
 * keeps in all three flavors of a stack.
 */
const BUNDLE_JSPLUGIN_PACKAGES = new Set(
  Object.keys(
    (
      JSON.parse(
        await readFile(
          new URL('../../packages/plugins-oxlint/package.json', import.meta.url),
          'utf8',
        ),
      ) as { dependencies?: Record<string, string> }
    ).dependencies ?? {},
  ),
)

/** The packages every example declares, whatever its flavor and stack. */
const SHARED_PACKAGES = ['@lumirelle/linter-config', '@lumirelle/tsconfig', 'typescript']

/** Every example the playground ships, and every stack with the three flavors it ships. */
const { examples: EXAMPLES, stacks: STACKS } = await exampleTables()

/**
 * Every file under `directory`, as `/`-separated paths relative to it.
 *
 * `node_modules` is skipped wherever it appears: every example carries the install artifacts of its
 * own workspace, and they are not part of the snapshot a reader copies.
 */
async function filesUnder(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { recursive: true, withFileTypes: true })
  return entries
    .filter(entry => entry.isFile())
    .map(entry => relative(directory, join(entry.parentPath, entry.name)).split(sep).join('/'))
    .filter(path => !path.split('/').includes('node_modules'))
    .sort()
}

/** One example's manifest, as the workspace reads it. */
interface Manifest {
  name: string
  devDependencies?: Record<string, string>
}

async function manifestOf(example: Example): Promise<Manifest> {
  return JSON.parse(await readFile(join(example.directory, 'package.json'), 'utf8')) as Manifest
}

/** The packages an example declares. */
async function declaredPackages(example: Example): Promise<string[]> {
  return Object.keys((await manifestOf(example)).devDependencies ?? {})
}

/**
 * The specifiers an example's Oxlint Emission loads, as the Emission spells them.
 *
 * The Adapter declares all of them once, in the `lumirelle/oxlint/jsPlugins` object, which the composer
 * carries as an override; a flavor that ships no Oxlint config loads none.
 */
function jsPluginSpecifiers(example: Example): string[] {
  const entries = [
    ...(example.oxlint?.jsPlugins ?? []),
    ...(example.oxlint?.overrides ?? []).flatMap(override => override.jsPlugins ?? []),
  ]

  return entries.map(entry => (typeof entry === 'string' ? entry : entry.specifier))
}

describe('the flavor directories', () => {
  describe.each(STACKS)('the $stack stack', ({ examples }) => {
    it('differs between its flavors only in the files a flavor owns', async () => {
      const own = (files: string[]) => files.filter(file => !FLAVOR_FILES.has(file))
      const listed = await Promise.all(examples.map(example => filesUnder(example.directory)))
      const shared = listed.map(own)

      // The same stack files everywhere: a file only one flavor carries, or a directory that moved
      // between flavors, fails here before a single byte is compared.
      for (const files of shared.slice(1)) {
        expect(files).toEqual(shared[0])
      }

      // Every other file byte-identical, which is what makes a stack's three directories a
      // consumer snapshot of one stack rather than three drifting copies. Keeping this honest: it
      // was proved by appending a comment to `playground/eslint/ts/src/greet.ts`, which turned this
      // test red with `eslint/ts src/greet.ts`, and then reverting the edit.
      const [first] = examples
      let compared = 0
      for (const path of shared[0] ?? []) {
        const expected = await readFile(join(first!.directory, path))
        for (const example of examples.slice(1)) {
          expect(
            await readFile(join(example.directory, path)),
            `${example.name} differs in ${path}`,
          ).toEqual(expected)
        }
        compared++
      }

      // Non-vacuous: the walk found the stack's own files, including its `tsconfig.json`, rather
      // than comparing an empty list.
      expect(compared).toBeGreaterThan(0)
      expect(shared[0]).toContain('tsconfig.json')
    })
  })

  describe.each(EXAMPLES)('$name', example => {
    it('declares exactly the tool packages its flavor runs', async () => {
      // A flavor declares the tool it runs: an ESLint-only example that installed `oxlint` would
      // illustrate a dependency it never needs, and an Oxlint-only one that installed the ESLint
      // plugin Bundle would hide that the flavor strips it.
      const tools = (await declaredPackages(example))
        .filter(name => ALL_TOOL_PACKAGES.has(name))
        .sort()

      expect(tools).toEqual([...TOOL_PACKAGES[example.flavor]].sort())
    })

    it('declares none of the plugin packages the Oxlint Plugin Bundle ships', async () => {
      // The Bundle ships these and resolves each to a path, so a flavor that also declared one would
      // install a second copy nothing reads, and the snapshot a reader copies would teach that install.
      const declared = (await declaredPackages(example)).filter(name =>
        BUNDLE_JSPLUGIN_PACKAGES.has(name),
      )

      expect(declared).toEqual([])

      // The Emission keeps naming them, which is why the manifest need not: a specifier is read as the
      // package it points at, and a Bundle-backed one arrives as a path rather than as a bare name the
      // project has to resolve from its own install.
      const bundled = jsPluginSpecifiers(example).filter(specifier =>
        BUNDLE_JSPLUGIN_PACKAGES.has(pluginPackageName(specifier)),
      )
      if (example.oxlint) {
        expect(bundled.length, `${example.name} loads no plugin the Bundle ships`).toBeGreaterThan(
          0,
        )
      }
      for (const specifier of bundled) {
        expect(
          isAbsolute(specifier),
          `${example.name} resolves ${pluginPackageName(specifier)} from the project`,
        ).toBe(true)
      }
    })

    it('is named after its directory', async () => {
      // The directory token is the example-name segment and the package-name segment, so a package
      // can be found from its path and a reader can copy the name the playground prints.
      const segments = relative(PLAYGROUND, example.directory).split(sep)

      expect((await manifestOf(example)).name).toBe(`@lumirelle/example-${segments.join('-')}`)
    })
  })

  describe.each(STACKS)('the $stack manifests', ({ examples }) => {
    it('share one dependency set outside the flavor-owned packages', async () => {
      const shared = await Promise.all(
        examples.map(async example => {
          // The linter and its plugin Bundle are the only packages a flavor owns: a plugin a Module needs
          // is an optional peer or a Bundle dependency, and neither is installed per flavor.
          return (await declaredPackages(example))
            .filter(name => !TOOL_PACKAGES[example.flavor].includes(name))
            .sort()
        }),
      )

      // The peers the stack's Modules require stay in every flavor because Source's peer check runs
      // for both Adapters, so what the three flavors share is the stack's own dependency set.
      for (const packages of shared.slice(1)) {
        expect(packages).toEqual(shared[0])
      }
      expect(shared[0]).toEqual(expect.arrayContaining(SHARED_PACKAGES))
    })
  })
})
