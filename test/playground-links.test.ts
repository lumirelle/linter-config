import { existsSync } from 'node:fs'
import { readdir, readFile } from 'node:fs/promises'
import { dirname, join, relative, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

/** The documentation walk's root: every Markdown file an example ships, plus the index. */
const PLAYGROUND = join(dirname(fileURLToPath(import.meta.url)), '..', 'playground')

/** One Markdown link target, written as `[text](target)`. */
const LINK = /\]\((?<target>[^)\s]+)\)/g

/** Every Markdown file under `directory`, skipping the install artifacts every example carries. */
async function markdownFiles(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { recursive: true, withFileTypes: true })
  return entries
    .filter(entry => entry.isFile() && entry.name.endsWith('.md'))
    .map(entry => join(entry.parentPath, entry.name))
    .filter(path => !path.split(sep).includes('node_modules'))
    .sort()
}

/**
 * The link targets in one file, in order.
 *
 * Fenced code blocks are skipped: a fenced snippet may show link syntax without pointing anywhere.
 * Prose is where a link is a promise about this repository.
 */
function linkTargets(markdown: string): string[] {
  const targets: string[] = []
  let fenced = false
  for (const line of markdown.split('\n')) {
    const trimmed = line.trimStart()
    if (trimmed.startsWith('```') || trimmed.startsWith('~~~')) {
      fenced = !fenced
      continue
    }
    if (fenced) {
      continue
    }
    for (const match of line.matchAll(LINK)) {
      targets.push(match.groups!.target!)
    }
  }
  return targets
}

/**
 * The repository path a target points at, or nothing when it does not point at one.
 *
 * Absolute URLs (any scheme, `mailto:` included) leave the repository, and a bare anchor stays in
 * the same file; neither is a path this walk can or should resolve. An anchor or query on a path is
 * dropped: `./foo.md#section` promises the file, and the heading is Markdown's problem.
 */
function repositoryPath(target: string): string | undefined {
  if (target.startsWith('#') || /^[a-z][a-z\d+.-]*:/i.test(target)) {
    return undefined
  }
  const [path] = target.split(/[?#]/)
  return path === '' ? undefined : path
}

describe('the playground documentation', () => {
  it('links only to paths that exist', async () => {
    const files = await markdownFiles(PLAYGROUND)
    const broken: string[] = []
    let checked = 0

    for (const file of files) {
      for (const target of linkTargets(await readFile(file, 'utf8'))) {
        const path = repositoryPath(target)
        if (!path) {
          continue
        }
        checked++
        if (!existsSync(resolve(dirname(file), path))) {
          // The file and the target, because a bare path in a failure list says neither which
          // README wrote it nor what it meant.
          broken.push(`${relative(PLAYGROUND, file)} -> ${target}`)
        }
      }
    }

    expect(broken, 'relative links that do not resolve').toEqual([])
    // Non-vacuous: the walk found the index and every example's README, and the matrix's links are
    // among the ones it resolved.
    expect(files.length).toBeGreaterThanOrEqual(22)
    expect(checked).toBeGreaterThanOrEqual(21)
  })
})
