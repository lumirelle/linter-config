import { describe, expect, it } from 'vitest'
import { configNamed, configNames, expectNoModules, expectOxlintReadsVue, loadExample } from './helpers/emission'

describe('the `eslint-oxlint/nuxt` example', () => {
  it('emits the Vue, UnoCSS and test Config objects a Nuxt application asks for', async () => {
    const { eslint } = await loadExample('eslint-oxlint/nuxt')
    const names = configNames(eslint)

    expect(names).toContain('lumirelle/vue/setup')
    expect(names).toContain('lumirelle/vue/rules')
    expect(names).toContain('lumirelle/unocss/setup')
    expect(names).toContain('lumirelle/test/rules')
  })

  it('keeps the Vue Module\'s accessibility sub-option off', async () => {
    const { eslint, options } = await loadExample('eslint-oxlint/nuxt')
    const ruleKeys = Object.keys(configNamed(eslint, 'lumirelle/vue/rules').rules ?? {})

    // `vue: true` is the whole option, so the 22 `vue-a11y/*` rules stay out of the rules object
    // and the `vue-a11y` plugin stays undeclared on the setup object.
    expect(options.vue).toBe(true)
    expect(ruleKeys.filter(key => key.startsWith('vue-a11y/'))).toEqual([])
    expect(Object.keys(configNamed(eslint, 'lumirelle/vue/setup').plugins ?? {})).toEqual(['vue'])
  })

  it('does not emit the framework Modules the example leaves off', async () => {
    const { eslint } = await loadExample('eslint-oxlint/nuxt')

    expectNoModules(eslint, ['react', 'nextjs'])
  })

  it('emits an Oxlint config that reads Vue files', async () => {
    const { oxlint } = await loadExample('eslint-oxlint/nuxt')

    expectOxlintReadsVue(oxlint)
  })
})
