import type { Example, Flavor } from '../../playground/examples'
import { readdir, readFile } from 'node:fs/promises'
import { dirname, join, relative, sep } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { listExamples, listStacks, resolveExample, resolveStack } from '../../playground/examples'

/** Where the examples live, so a package name can be read off its directory. */
const PLAYGROUND = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'playground')

/**
 * The files a stack's flavors are allowed to differ in: the two config modules, the options module
 * they read, the manifest and the README.
 *
 * Everything else — the source tree, the project file, the framework config files — is the stack's
 * rather than the flavor's, so it is byte-identical in all three directories.
 */
const FLAVOR_FILES = new Set(['README.md', 'eslint.config.js', 'options.ts', 'oxlint.config.ts', 'package.json'])

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

/** Every package any flavor installs as a tool, so a manifest's shared set is the rest. */
const ALL_TOOL_PACKAGES = new Set(Object.values(TOOL_PACKAGES).flat())

/** The packages every example declares, whatever its flavor and stack. */
const SHARED_PACKAGES = ['@lumirelle/linter-config', '@lumirelle/tsconfig', 'typescript']

/** Every example, resolved the way the runner resolves it. */
const EXAMPLES = await Promise.all((await listExamples()).map(name => resolveExample(name)))

/** Every stack, with the three flavors it ships. */
const STACKS = await Promise.all(
  (await listStacks()).map(async stack => ({ stack, examples: await resolveStack(stack) })),
)

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
          expect(await readFile(join(example.directory, path)), `${example.name} differs in ${path}`).toEqual(expected)
        }
        compared++
      }

      // Non-vacuous: the walk found the stack's own files, including the project file the ticket
      // names, rather than comparing an empty list.
      expect(compared).toBeGreaterThan(0)
      expect(shared[0]).toContain('tsconfig.json')
    })
  })

  describe.each(EXAMPLES)('$name', (example) => {
    it('declares exactly the tool packages its flavor runs', async () => {
      // A flavor declares the tool it runs: an ESLint-only example that installed `oxlint` would
      // illustrate a dependency it never needs, and an Oxlint-only one that installed the ESLint
      // plugin Bundle would hide that the flavor strips it.
      const tools = (await declaredPackages(example)).filter(name => ALL_TOOL_PACKAGES.has(name)).sort()

      expect(tools).toEqual([...TOOL_PACKAGES[example.flavor]].sort())
    })

    it('is named after its directory', async () => {
      // The directory token is the example-name segment and the package-name segment, so a package
      // can be found from its path and a reader can copy the name the playground prints.
      const segments = relative(PLAYGROUND, example.directory).split(sep)

      expect((await manifestOf(example)).name).toBe(`@lumirelle/example-${segments.join('-')}`)
    })
  })

  describe.each(STACKS)('the $stack manifests', ({ examples }) => {
    it('share one dependency set outside the tool packages', async () => {
      const shared = await Promise.all(examples.map(async (example) => {
        return (await declaredPackages(example)).filter(name => !ALL_TOOL_PACKAGES.has(name)).sort()
      }))

      // Framework peers stay in every flavor because Source's peer check runs for both Adapters, so
      // the only dependency difference between flavors is the tool packages themselves.
      for (const packages of shared.slice(1)) {
        expect(packages).toEqual(shared[0])
      }
      expect(shared[0]).toEqual(expect.arrayContaining(SHARED_PACKAGES))
    })
  })
})
