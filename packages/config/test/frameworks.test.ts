import { describe, expect, it } from 'vitest'
import { eslint } from '../src/eslint'
import { oxlint } from '../src/oxlint'
import { eslintObject, houseOptions, jsPluginsOf, rulesOf } from './helpers/emission'

const FRAMEWORK_TAGS = [
  'jsx',
  'vue',
  'react',
  'nextjs',
  'solid',
  'unocss',
  'svelte',
  'astro',
  'angular',
]

/** The names of the Config objects an Emission emitted. */
async function names(options = {}): Promise<string[]> {
  return (await eslint(houseOptions(options))).map(config => config.name as string)
}

describe('the framework Modules', () => {
  it('stay out of the Emission until the caller opts in', async () => {
    const emitted = await names()

    for (const tag of FRAMEWORK_TAGS) {
      expect(
        emitted.filter(name => name.includes(`/${tag}`)),
        `${tag} is opt-in`,
      ).toEqual([])
    }
  })

  // `svelte` is left out: loading `eslint-plugin-svelte` needs the `svelte` package itself, which
  // this workspace does not install, so its ESLint emission cannot be composed here.
  it.each(FRAMEWORK_TAGS.filter(tag => tag !== 'svelte'))(
    'composes %s once the caller opts in',
    async tag => {
      // Every framework is reachable from the one place that knows its options; what this asserts is
      // that the flag alone is enough to compose it, which is what the peer check runs behind.
      const options = { [tag]: true }

      expect(() => {
        void eslint(houseOptions(options))
      }).not.toThrow()
    },
  )
})

describe('eslint() react module', () => {
  it("emits Upstream's four objects in order", async () => {
    const emitted = await names({ react: true })

    expect(emitted.filter(name => name.includes('/react'))).toEqual([
      'lumirelle/react/setup',
      'lumirelle/react/rules',
      'lumirelle/react/typescript',
    ])
  })

  it('declares both peer plugins on the setup object', async () => {
    expect(
      Object.keys((await eslintObject('lumirelle/react/setup', { react: true })).plugins ?? {}),
    ).toEqual(['react', 'react-refresh'])
  })

  it('carries the recommended set and the refresh rule on the scoped object', async () => {
    const rules = rulesOf(await eslintObject('lumirelle/react/rules', { react: true }))

    expect(rules['react/rules-of-hooks']).toBe('error')
    expect(rules['react/no-direct-mutation-state']).toBe('error')
    expect(rules['react-refresh/only-export-components']).toEqual([
      'error',
      {
        allowConstantExport: true,
        allowExportNames: [],
      },
    ])
  })

  it('turns off the two rules TypeScript already reports', async () => {
    const rules = rulesOf(await eslintObject('lumirelle/react/typescript', { react: true }))

    expect(rules).toEqual({
      'react/dom-no-string-style-prop': 'off',
      'react/dom-no-unknown-property': 'off',
    })
  })

  it('adds the type-aware object only when the caller names a tsconfig', async () => {
    const names = await (async () =>
      (
        await eslint(
          houseOptions({
            react: true,
            typescript: { tsconfigPath: 'tsconfig.json' },
          }),
        )
      ).map(config => config.name))()

    expect(names).toContain('lumirelle/react/type-aware-rules')
    expect(
      await namesOrNothing('lumirelle/react/type-aware-rules', { react: true }),
    ).toBeUndefined()
  })
})

async function namesOrNothing(name: string, options = {}): Promise<string | undefined> {
  return (await names(options)).find(candidate => candidate === name)
}

describe('eslint() nextjs module', () => {
  it('keeps `settings` on the root object, because a scoped object may not carry it', async () => {
    const setup = await eslintObject('lumirelle/nextjs/setup', { nextjs: true })
    const rules = await eslintObject('lumirelle/nextjs/rules', { nextjs: true })

    expect(setup.settings).toEqual({ react: { version: 'detect' } })
    expect(setup.files).toBeUndefined()
    expect(rules.settings).toBeUndefined()
    expect(rules.files?.length).toBeGreaterThan(0)
  })

  it('carries the recommended and core-web-vitals rules with the next/ prefix', async () => {
    const rules = rulesOf(await eslintObject('lumirelle/nextjs/rules', { nextjs: true }))

    expect(rules['next/no-img-element']).toBe('warn')
    // `core-web-vitals` raises these two over `recommended`.
    expect(rules['next/no-html-link-for-pages']).toBe('error')
    expect(rules['next/no-sync-scripts']).toBe('error')
  })
})

describe('eslint() jsx module', () => {
  it('turns on the JSX parser flag for JSX sources without declaring a plugin', async () => {
    const setup = await eslintObject('lumirelle/jsx/setup', { jsx: true })

    expect(setup.files).toEqual(['**/*.{jsx,cjsx,mjsx}', '**/*.{tsx,ctsx,mtsx}'])
    expect(setup.plugins).toBeUndefined()
    const parserOptions = setup.languageOptions?.parserOptions as
      | { ecmaFeatures?: unknown }
      | undefined

    expect(parserOptions?.ecmaFeatures).toEqual({ jsx: true })
  })
})

describe('oxlint() over the framework Modules', () => {
  it('maps the React rules onto the built-in react scope', async () => {
    const config = await oxlint(houseOptions({ react: true }))
    const rules = (config.overrides ?? []).flatMap(override => Object.keys(override.rules ?? {}))

    expect(rules).toContain('react/rules-of-hooks')
    // `eslint-plugin-react-refresh` has no Oxlint realization, so its rule is left to ESLint.
    expect(rules).not.toContain('react-refresh/only-export-components')
  })

  it('maps the Next.js rules onto the built-in nextjs scope', async () => {
    const config = await oxlint(houseOptions({ nextjs: true }))
    const rules = (config.overrides ?? []).flatMap(override => Object.keys(override.rules ?? {}))

    // Oxlint reads the plugin under its built-in scope name, `nextjs`.
    expect(rules).toContain('nextjs/no-img-element')
    expect(rules).toContain('nextjs/no-sync-scripts')
  })

  it('realizes the Solid and UnoCSS plugins through jsPlugins, aliased as their ids', async () => {
    const declarations = await jsPluginsOf({ solid: true, unocss: true })

    expect(declarations).toContainEqual({ name: 'solid', specifier: 'eslint-plugin-solid' })
    expect(declarations).toContainEqual({ name: 'unocss', specifier: '@unocss/eslint-plugin' })
  })

  it.each(['svelte', 'astro', 'angular'] as const)(
    'leaves the Emission alone for the %s Domain',
    async tag => {
      const config = await oxlint(houseOptions({ [tag]: true }))

      expect(JSON.stringify(config)).not.toContain(`"${tag}/`)
    },
  )
})
