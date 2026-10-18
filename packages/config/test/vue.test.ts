import { describe, expect, it } from 'vitest'
import { eslint } from '../src/eslint'
import { oxlint } from '../src/oxlint'
import { eslintObject, houseOptions, rulesOf } from './helpers/emission'

/** The names of the Config objects an Emission emitted. */
async function names(options = {}): Promise<string[]> {
  return (await eslint(houseOptions(options))).map(config => config.name as string)
}

describe('eslint() vue module', () => {
  it('stays out of the Emission until the caller opts in', async () => {
    expect((await names()).filter(name => name.includes('/vue'))).toEqual([])
  })

  it('emits the two objects in Upstream order', async () => {
    expect((await names({ vue: true })).filter(name => name.includes('/vue'))).toEqual([
      'lumirelle/vue/setup',
      'lumirelle/vue/rules',
    ])
  })

  it('declares the Vue plugin and the auto-import globals on the root object', async () => {
    const setup = await eslintObject('lumirelle/vue/setup', { vue: true })

    expect(Object.keys(setup.plugins ?? {})).toEqual(['vue'])
    expect(setup.files).toBeUndefined()
    // `false` is a read-only global in both Emissions' spelling; Upstream declares these `'readonly'`.
    expect(setup.languageOptions?.globals).toMatchObject({
      computed: false,
      defineProps: false,
      ref: false,
      watchEffect: false,
    })
  })

  it('scopes the rules to single-file components with the nested TypeScript parser', async () => {
    const rules = await eslintObject('lumirelle/vue/rules', { vue: true })
    const parserOptions = rules.languageOptions?.parserOptions as Record<string, unknown>

    expect(rules.files).toEqual(['**/*.vue'])
    expect(parserOptions.extraFileExtensions).toEqual(['.vue'])
    expect(parserOptions.ecmaFeatures).toEqual({ jsx: true })
    // `typescript` is installed in this workspace, so the component parser delegates to the TS one.
    expect(typeof parserOptions.parser).toBe('object')
  })

  it('merges the SFC block processor in front of the Vue processor', async () => {
    const rules = await eslintObject('lumirelle/vue/rules', { vue: true })

    expect(rules.processor).toMatchObject({
      meta: { name: 'merged-processor:eslint-plugin-vue+eslint-processor-vue-blocks' },
      supportsAutofix: true,
    })
  })

  it('uses the bare Vue processor when the caller turns SFC blocks off', async () => {
    const rules = await eslintObject('lumirelle/vue/rules', { vue: { sfcBlocks: false } })

    expect((rules.processor as { meta: { name: string } }).meta.name).toBe('eslint-plugin-vue')
  })

  it('composes the Vue 3 presets by default and the Vue 2 chain on request', async () => {
    const vue3 = rulesOf(await eslintObject('lumirelle/vue/rules', { vue: true }))
    const vue2 = rulesOf(await eslintObject('lumirelle/vue/rules', { vue: { vueVersion: 2 } }))

    // Vue 3 only: the `<script setup>` rules `vue2` does not have.
    expect(vue3['vue/no-export-in-script-setup']).toBe('error')
    expect(vue2['vue/no-export-in-script-setup']).toBe('error')
    expect(vue3['vue/no-multiple-template-root']).toBeUndefined()
    expect(vue2['vue/no-multiple-template-root']).toBe('error')
  })

  it('turns on the stylistic family only with the stylistic option', async () => {
    expect(rulesOf(await eslintObject('lumirelle/vue/rules', { vue: true }))['vue/array-bracket-spacing']).toBeUndefined()
    expect(rulesOf(await eslintObject('lumirelle/vue/rules', { stylistic: true, vue: true }))['vue/html-indent'])
      .toEqual(['error', 2])
    expect(rulesOf(await eslintObject('lumirelle/vue/rules', { stylistic: { braceStyle: '1tbs', indent: 4 }, vue: true }))['vue/brace-style'])
      .toEqual(['error', '1tbs', { allowSingleLine: true }])
  })

  it('keeps the house rule set Upstream overrides inside the module', async () => {
    const rules = rulesOf(await eslintObject('lumirelle/vue/rules', { vue: true }))

    expect(rules['vue/block-order']).toEqual(['error', { order: ['script', 'template', 'style'] }])
    expect(rules['vue/no-v-html']).toBe('off')
    expect(rules['antfu/no-top-level-await']).toBe('off')
    expect(rules['ts/explicit-function-return-type']).toBe('off')
  })
})

describe('eslint() vue accessibility', () => {
  it('loads the peer plugin under the `vue-a11y` id when asked', async () => {
    const setup = await eslintObject('lumirelle/vue/setup', { vue: { a11y: true } })

    expect(Object.keys(setup.plugins ?? {})).toEqual(['vue', 'vue-a11y'])
    expect(rulesOf(await eslintObject('lumirelle/vue/rules', { vue: { a11y: true } }))['vue-a11y/alt-text'])
      .toBe('error')
  })

  it('keeps the peer out of an Emission that does not ask for it', async () => {
    const rules = rulesOf(await eslintObject('lumirelle/vue/rules', { vue: true }))

    expect(Object.keys(rules).filter(key => key.startsWith('vue-a11y/'))).toEqual([])
  })
})

describe('the Component extension', () => {
  it('widens the TypeScript Module to `.vue` files, so their scripts are typed', async () => {
    const parser = await eslintObject('lumirelle/typescript/parser', { vue: true })
    const files = parser.files as string[]
    const parserOptions = parser.languageOptions?.parserOptions as { extraFileExtensions: string[] }

    expect(files).toContain('**/*.vue')
    expect(parserOptions.extraFileExtensions).toContain('.vue')
  })

  it('adds the caller\'s own component extensions as well', async () => {
    const parser = await eslintObject('lumirelle/typescript/parser', { componentExts: ['md'], vue: true })

    expect(parser.files as string[]).toContain('**/*.md')
  })
})

describe('oxlint() vue module', () => {
  it('maps the Module onto the built-in vue scope instead of dropping it', async () => {
    const config = await oxlint(houseOptions({ vue: true }))
    const carried = (config.overrides ?? []).flatMap(override => Object.keys(override.rules ?? {}))

    expect(carried).toContain('vue/no-dupe-keys')
    expect(carried).toContain('vue/no-export-in-script-setup')
    expect(carried.some(key => key.startsWith('vue/'))).toBe(true)
    // Upstream's cross-module disables survive the mapping too.
    expect(carried).toContain('typescript/explicit-function-return-type')
  })

  it('keeps the Vue globals', async () => {
    const config = await oxlint(houseOptions({ vue: true }))
    const globals: Record<string, string> = {}
    Object.assign(globals, ...(config.overrides ?? []).map(override => override.globals ?? {}))

    expect(globals).toMatchObject({ ref: 'readonly', defineProps: 'readonly' })
  })

  it('declares no jsPlugins for the built-in scope', async () => {
    const config = await oxlint(houseOptions({ vue: { a11y: true } }))
    const aliases = (config.overrides ?? []).flatMap(override => (override.jsPlugins ?? []).map(entry =>
      typeof entry === 'string' ? entry : entry.name,
    ))

    // `vue` is a built-in scope, so the Module adds no alias; `vue-a11y` has no Oxlint realization.
    expect(aliases).not.toContain('vue')
    expect(aliases).not.toContain('vue-a11y')
  })

  it('emits nothing for the Module when the caller leaves it off', async () => {
    const config = await oxlint(houseOptions())
    const carried = (config.overrides ?? []).flatMap(override => Object.keys(override.rules ?? {}))

    expect(carried.some(key => key.startsWith('vue/'))).toBe(false)
  })
})
