import { describe, expect, it } from 'vitest'
import {
  configNamed,
  configNames,
  expectNoModules,
  expectOxlintReadsVue,
  loadExample,
  objectsOfModule,
} from './helpers/emission'

describe('the `eslint-oxlint/vue` example', () => {
  it('emits the Vue, UnoCSS and test Config objects a Vite single-page application asks for', async () => {
    const { eslint } = await loadExample('eslint-oxlint/vue')
    const names = configNames(eslint)

    expect(names).toContain('lumirelle/vue/setup')
    expect(names).toContain('lumirelle/vue/rules')
    expect(names).toContain('lumirelle/unocss/setup')
    expect(names).toContain('lumirelle/test/rules')
  })

  it('merges the accessibility rules into the Vue rules object', async () => {
    const { eslint, options } = await loadExample('eslint-oxlint/vue')
    const ruleKeys = Object.keys(configNamed(eslint, 'lumirelle/vue/rules').rules ?? {})

    expect(options.vue).toEqual({ a11y: true })
    expect(ruleKeys.some(key => key.startsWith('vue-a11y/'))).toBe(true)
    // Merged, not appended: the sub-option adds rules and a plugin, never a Config object.
    expect(objectsOfModule(eslint, 'vue')).toEqual(['lumirelle/vue/setup', 'lumirelle/vue/rules'])
    expect(Object.keys(configNamed(eslint, 'lumirelle/vue/setup').plugins ?? {})).toEqual([
      'vue',
      'vue-a11y',
    ])
  })

  it('does not emit the framework Modules the example leaves off', async () => {
    const { eslint } = await loadExample('eslint-oxlint/vue')

    expectNoModules(eslint, ['react', 'nextjs'])
  })

  it('emits an Oxlint config that reads Vue files', async () => {
    const { oxlint } = await loadExample('eslint-oxlint/vue')

    expectOxlintReadsVue(oxlint)
  })
})
