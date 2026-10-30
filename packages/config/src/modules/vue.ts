import type { ConfigObject, Options, StylisticIndent } from '../types'
import { GLOB_VUE } from '../globs'
import { requirePeerPackages } from '../packages'
import { pluginRef } from '../plugins'

/**
 * The auto-import globals the Vue plugin needs to see, so a template or script that uses the
 * compiler macros and the reactivity helpers is not reported as an undefined global.
 *
 * Upstream spells every one of them `'readonly'`: they are compiler output, not variables a file
 * may assign to, so the boolean convention says `false`.
 */
const VUE_GLOBALS: Record<string, boolean> = {
  computed: false,
  defineEmits: false,
  defineExpose: false,
  defineProps: false,
  onMounted: false,
  onUnmounted: false,
  reactive: false,
  ref: false,
  shallowReactive: false,
  shallowRef: false,
  toRef: false,
  toRefs: false,
  watch: false,
  watchEffect: false,
}

/** The block selection Upstream always adds: a `<style>` block becomes lintable CSS-ish text. */
const DEFAULT_SFC_BLOCKS = { styles: true }

/**
 * Upstream's `configs/vue.ts`: `eslint-plugin-vue` over single-file components, with the nested
 * TypeScript parser, the SFC block processor and the optional `vue-a11y` peer.
 *
 * Oxlint reads `.vue` natively, so the Module carries the `vue` Domain and its rules map onto
 * Oxlint's built-in `vue` scope instead of being dropped. The processor, the nested parser and
 * the `extraFileExtensions` are ESLint-only.
 */
export function vue(
  options: Pick<Options, 'componentExts' | 'stylistic' | 'typescript' | 'vue'> = {},
): ConfigObject[] {
  const vueOptions = typeof options.vue === 'object' && options.vue !== null ? options.vue : {}
  const { a11y = false, sfcBlocks = true, vueVersion = 3 } = vueOptions
  const stylistic = options.stylistic !== undefined && options.stylistic !== false
  const hasTypeScript = options.typescript !== undefined && options.typescript !== false

  if (a11y) {
    requirePeerPackages('vue', ['vue-a11y'])
  }

  const braceStyle =
    typeof options.stylistic === 'object'
      ? (options.stylistic.braceStyle ?? 'stroustrup')
      : 'stroustrup'
  const indent = typeof options.stylistic === 'object' ? indentOf(options.stylistic.indent) : 2
  const blocks = typeof sfcBlocks === 'object' ? sfcBlocks : {}
  const blockSelection =
    typeof blocks.blocks === 'object' && blocks.blocks !== null ? blocks.blocks : {}

  return [
    {
      name: 'lumirelle/vue/setup',
      module: 'vue',
      domain: 'vue',
      globals: VUE_GLOBALS,
      plugins: {
        vue: pluginRef('vue'),
        ...(a11y ? { 'vue-a11y': pluginRef('vue-a11y') } : {}),
      },
    },
    {
      name: 'lumirelle/vue/rules',
      module: 'vue',
      domain: 'vue',
      files: [GLOB_VUE],
      tools: {
        eslint: {
          parser: pluginRef('vue'),
          // The SFC processor turns each block into a virtual file; with `sfcBlocks` on, the
          // Bundle's glue also hands the template and style blocks to their own linting pass.
          processor:
            sfcBlocks === false
              ? { plugin: pluginRef('vue'), name: '.vue' }
              : {
                  plugin: pluginRef('vue'),
                  name: 'vue-blocks',
                  options: { ...blocks, blocks: { ...DEFAULT_SFC_BLOCKS, ...blockSelection } },
                },
          languageOptions: {
            parserOptions: {
              ecmaFeatures: { jsx: true },
              extraFileExtensions: ['.vue'],
              sourceType: 'module',
              ...(hasTypeScript ? { parser: pluginRef('ts') } : {}),
            },
          },
        },
      },
      rules: {
        'vue/comment-directive': 'error',
        'vue/jsx-uses-vars': 'error',

        ...(vueVersion === 2
          ? {
              'vue/attribute-hyphenation': 'warn',
              'vue/attributes-order': 'warn',
              'vue/block-order': 'warn',
              'vue/component-definition-name-casing': 'warn',
              'vue/first-attribute-linebreak': 'warn',
              'vue/html-closing-bracket-newline': 'warn',
              'vue/html-closing-bracket-spacing': 'warn',
              'vue/html-end-tags': 'warn',
              'vue/html-indent': 'warn',
              'vue/html-quotes': 'warn',
              'vue/html-self-closing': 'warn',
              'vue/max-attributes-per-line': 'warn',
              'vue/multi-word-component-names': 'error',
              'vue/multiline-html-element-content-newline': 'warn',
              'vue/mustache-interpolation-spacing': 'warn',
              'vue/no-arrow-functions-in-watch': 'error',
              'vue/no-async-in-computed-properties': 'error',
              'vue/no-child-content': 'error',
              'vue/no-computed-properties-in-data': 'error',
              'vue/no-custom-modifiers-on-v-model': 'error',
              'vue/no-dupe-keys': 'error',
              'vue/no-dupe-v-else-if': 'error',
              'vue/no-duplicate-attributes': 'error',
              'vue/no-export-in-script-setup': 'error',
              'vue/no-lone-template': 'warn',
              'vue/no-multi-spaces': 'warn',
              'vue/no-multiple-slot-args': 'warn',
              'vue/no-multiple-template-root': 'error',
              'vue/no-mutating-props': 'error',
              'vue/no-parsing-error': 'error',
              'vue/no-ref-as-operand': 'error',
              'vue/no-required-prop-with-default': 'warn',
              'vue/no-reserved-component-names': 'error',
              'vue/no-reserved-keys': 'error',
              'vue/no-reserved-props': ['error', { vueVersion: 2 }],
              'vue/no-shared-component-data': 'error',
              'vue/no-side-effects-in-computed-properties': 'error',
              'vue/no-spaces-around-equal-signs-in-attribute': 'warn',
              'vue/no-template-key': 'error',
              'vue/no-template-shadow': 'warn',
              'vue/no-textarea-mustache': 'error',
              'vue/no-unused-components': 'error',
              'vue/no-unused-vars': 'error',
              'vue/no-use-computed-property-like-method': 'error',
              'vue/no-use-v-if-with-v-for': 'error',
              'vue/no-useless-template-attributes': 'error',
              'vue/no-v-for-template-key': 'error',
              'vue/no-v-html': 'warn',
              'vue/no-v-model-argument': 'error',
              'vue/no-v-text-v-html-on-component': 'error',
              'vue/one-component-per-file': 'warn',
              'vue/order-in-components': 'warn',
              'vue/prop-name-casing': 'warn',
              'vue/require-component-is': 'error',
              'vue/require-default-prop': 'warn',
              'vue/require-prop-type-constructor': 'error',
              'vue/require-prop-types': 'warn',
              'vue/require-render-return': 'error',
              'vue/require-v-for-key': 'error',
              'vue/require-valid-default-prop': 'error',
              'vue/return-in-computed-property': 'error',
              'vue/return-in-emits-validator': 'error',
              'vue/singleline-html-element-content-newline': 'warn',
              'vue/this-in-template': 'warn',
              'vue/use-v-on-exact': 'error',
              'vue/v-bind-style': 'warn',
              'vue/v-on-style': 'warn',
              'vue/v-slot-style': 'warn',
              'vue/valid-attribute-name': 'error',
              'vue/valid-define-emits': 'error',
              'vue/valid-define-props': 'error',
              'vue/valid-model-definition': 'error',
              'vue/valid-next-tick': 'error',
              'vue/valid-template-root': 'error',
              'vue/valid-v-bind': 'error',
              'vue/valid-v-bind-sync': 'error',
              'vue/valid-v-cloak': 'error',
              'vue/valid-v-else': 'error',
              'vue/valid-v-else-if': 'error',
              'vue/valid-v-for': 'error',
              'vue/valid-v-html': 'error',
              'vue/valid-v-if': 'error',
              'vue/valid-v-model': 'error',
              'vue/valid-v-on': 'error',
              'vue/valid-v-once': 'error',
              'vue/valid-v-pre': 'error',
              'vue/valid-v-show': 'error',
              'vue/valid-v-slot': 'error',
              'vue/valid-v-text': 'error',
            }
          : {
              'vue/attribute-hyphenation': 'warn',
              'vue/attributes-order': 'warn',
              'vue/block-order': 'warn',
              'vue/comment-directive': 'error',
              'vue/component-definition-name-casing': 'warn',
              'vue/first-attribute-linebreak': 'warn',
              'vue/html-closing-bracket-newline': 'warn',
              'vue/html-closing-bracket-spacing': 'warn',
              'vue/html-end-tags': 'warn',
              'vue/html-indent': 'warn',
              'vue/html-quotes': 'warn',
              'vue/html-self-closing': 'warn',
              'vue/jsx-uses-vars': 'error',
              'vue/max-attributes-per-line': 'warn',
              'vue/multi-word-component-names': 'error',
              'vue/multiline-html-element-content-newline': 'warn',
              'vue/mustache-interpolation-spacing': 'warn',
              'vue/no-arrow-functions-in-watch': 'error',
              'vue/no-async-in-computed-properties': 'error',
              'vue/no-child-content': 'error',
              'vue/no-computed-properties-in-data': 'error',
              'vue/no-deprecated-data-object-declaration': 'error',
              'vue/no-deprecated-delete-set': 'error',
              'vue/no-deprecated-destroyed-lifecycle': 'error',
              'vue/no-deprecated-dollar-listeners-api': 'error',
              'vue/no-deprecated-dollar-scopedslots-api': 'error',
              'vue/no-deprecated-events-api': 'error',
              'vue/no-deprecated-filter': 'error',
              'vue/no-deprecated-functional-template': 'error',
              'vue/no-deprecated-html-element-is': 'error',
              'vue/no-deprecated-inline-template': 'error',
              'vue/no-deprecated-model-definition': 'error',
              'vue/no-deprecated-props-default-this': 'error',
              'vue/no-deprecated-router-link-tag-prop': 'error',
              'vue/no-deprecated-scope-attribute': 'error',
              'vue/no-deprecated-slot-attribute': 'error',
              'vue/no-deprecated-slot-scope-attribute': 'error',
              'vue/no-deprecated-v-bind-sync': 'error',
              'vue/no-deprecated-v-is': 'error',
              'vue/no-deprecated-v-on-native-modifier': 'error',
              'vue/no-deprecated-v-on-number-modifiers': 'error',
              'vue/no-deprecated-vue-config-keycodes': 'error',
              'vue/no-dupe-keys': 'error',
              'vue/no-dupe-v-else-if': 'error',
              'vue/no-duplicate-attributes': 'error',
              'vue/no-export-in-script-setup': 'error',
              'vue/no-expose-after-await': 'error',
              'vue/no-lifecycle-after-await': 'error',
              'vue/no-lone-template': 'warn',
              'vue/no-multi-spaces': 'warn',
              'vue/no-multiple-slot-args': 'warn',
              'vue/no-mutating-props': 'error',
              'vue/no-parsing-error': 'error',
              'vue/no-ref-as-operand': 'error',
              'vue/no-required-prop-with-default': 'warn',
              'vue/no-reserved-component-names': 'error',
              'vue/no-reserved-keys': 'error',
              'vue/no-reserved-props': 'error',
              'vue/no-shared-component-data': 'error',
              'vue/no-side-effects-in-computed-properties': 'error',
              'vue/no-spaces-around-equal-signs-in-attribute': 'warn',
              'vue/no-template-key': 'error',
              'vue/no-template-shadow': 'warn',
              'vue/no-textarea-mustache': 'error',
              'vue/no-unused-components': 'error',
              'vue/no-unused-vars': 'error',
              'vue/no-use-computed-property-like-method': 'error',
              'vue/no-use-v-if-with-v-for': 'error',
              'vue/no-useless-template-attributes': 'error',
              'vue/no-v-for-template-key-on-child': 'error',
              'vue/no-v-html': 'warn',
              'vue/no-v-text-v-html-on-component': 'error',
              'vue/no-watch-after-await': 'error',
              'vue/one-component-per-file': 'warn',
              'vue/order-in-components': 'warn',
              'vue/prefer-import-from-vue': 'error',
              'vue/prop-name-casing': 'warn',
              'vue/require-component-is': 'error',
              'vue/require-default-prop': 'warn',
              'vue/require-explicit-emits': 'warn',
              'vue/require-prop-type-constructor': 'error',
              'vue/require-prop-types': 'warn',
              'vue/require-render-return': 'error',
              'vue/require-slots-as-functions': 'error',
              'vue/require-toggle-inside-transition': 'error',
              'vue/require-v-for-key': 'error',
              'vue/require-valid-default-prop': 'error',
              'vue/return-in-computed-property': 'error',
              'vue/return-in-emits-validator': 'error',
              'vue/singleline-html-element-content-newline': 'warn',
              'vue/this-in-template': 'warn',
              'vue/use-v-on-exact': 'error',
              'vue/v-bind-style': 'warn',
              'vue/v-on-event-hyphenation': ['warn', 'always', { autofix: true }],
              'vue/v-on-style': 'warn',
              'vue/v-slot-style': 'warn',
              'vue/valid-attribute-name': 'error',
              'vue/valid-define-emits': 'error',
              'vue/valid-define-options': 'error',
              'vue/valid-define-props': 'error',
              'vue/valid-next-tick': 'error',
              'vue/valid-template-root': 'error',
              'vue/valid-v-bind': 'error',
              'vue/valid-v-cloak': 'error',
              'vue/valid-v-else': 'error',
              'vue/valid-v-else-if': 'error',
              'vue/valid-v-for': 'error',
              'vue/valid-v-html': 'error',
              'vue/valid-v-if': 'error',
              'vue/valid-v-is': 'error',
              'vue/valid-v-memo': 'error',
              'vue/valid-v-model': 'error',
              'vue/valid-v-on': 'error',
              'vue/valid-v-once': 'error',
              'vue/valid-v-pre': 'error',
              'vue/valid-v-show': 'error',
              'vue/valid-v-slot': 'error',
              'vue/valid-v-text': 'error',
            }),

        'antfu/no-top-level-await': 'off',
        'node/prefer-global/process': 'off',
        'ts/explicit-function-return-type': 'off',

        'vue/block-order': ['error', { order: ['script', 'template', 'style'] }],
        'vue/component-name-in-template-casing': ['error', 'PascalCase'],
        'vue/component-options-name-casing': ['error', 'PascalCase'],
        'vue/component-tags-order': 'off',
        'vue/custom-event-name-casing': ['error', 'camelCase'],
        'vue/define-macros-order': [
          'error',
          { order: ['defineOptions', 'defineProps', 'defineEmits', 'defineSlots'] },
        ],
        'vue/dot-location': ['error', 'property'],
        'vue/dot-notation': ['error', { allowKeywords: true }],
        'vue/eqeqeq': ['error', 'smart'],
        'vue/html-indent': ['error', indent],
        'vue/html-quotes': ['error', 'double'],
        'vue/max-attributes-per-line': 'off',
        'vue/multi-word-component-names': 'off',
        'vue/no-dupe-keys': 'off',
        'vue/no-empty-pattern': 'error',
        'vue/no-irregular-whitespace': 'error',
        'vue/no-loss-of-precision': 'error',
        'vue/no-restricted-syntax': [
          'error',
          'DebuggerStatement',
          'LabeledStatement',
          'WithStatement',
        ],
        'vue/no-restricted-v-bind': ['error', '/^v-/'],
        'vue/no-setup-props-reactivity-loss': 'off',
        'vue/no-sparse-arrays': 'error',
        'vue/no-unused-refs': 'error',
        'vue/no-useless-v-bind': 'error',
        'vue/no-v-html': 'off',
        'vue/object-shorthand': [
          'error',
          'always',
          { avoidQuotes: true, ignoreConstructors: false },
        ],
        'vue/prefer-separate-static-class': 'error',
        'vue/prefer-template': 'error',
        'vue/prop-name-casing': ['error', 'camelCase'],
        'vue/require-default-prop': 'off',
        'vue/require-prop-types': 'off',
        'vue/space-infix-ops': 'error',
        'vue/space-unary-ops': ['error', { nonwords: false, words: true }],

        ...(stylistic
          ? {
              'vue/array-bracket-spacing': ['error', 'never'],
              'vue/arrow-spacing': ['error', { after: true, before: true }],
              'vue/block-spacing': ['error', 'always'],
              'vue/block-tag-newline': ['error', { multiline: 'always', singleline: 'always' }],
              'vue/comma-dangle': ['error', 'always-multiline'],
              'vue/comma-spacing': ['error', { after: true, before: false }],
              'vue/comma-style': ['error', 'last'],
              'vue/html-comment-content-spacing': ['error', 'always', { exceptions: ['-'] }],
              'vue/key-spacing': ['error', { afterColon: true, beforeColon: false }],
              'vue/keyword-spacing': ['error', { after: true, before: true }],
              'vue/object-curly-newline': 'off',
              'vue/object-curly-spacing': ['error', 'always'],
              'vue/object-property-newline': ['error', { allowAllPropertiesOnSameLine: true }],
              'vue/operator-linebreak': ['error', 'before'],
              'vue/padding-line-between-blocks': ['error', 'always'],
              'vue/quote-props': ['error', 'consistent-as-needed'],
              'vue/space-in-parens': ['error', 'never'],
              'vue/template-curly-spacing': 'error',

              'vue/brace-style': ['error', braceStyle, { allowSingleLine: true }],
            }
          : {}),
        ...(a11y
          ? {
              'vue-a11y/alt-text': 'error',
              'vue-a11y/anchor-has-content': 'error',
              'vue-a11y/aria-props': 'error',
              'vue-a11y/aria-role': 'error',
              'vue-a11y/aria-unsupported-elements': 'error',
              'vue-a11y/click-events-have-key-events': 'error',
              'vue-a11y/form-control-has-label': 'error',
              'vue-a11y/heading-has-content': 'error',
              'vue-a11y/iframe-has-title': 'error',
              'vue-a11y/interactive-supports-focus': 'error',
              'vue-a11y/label-has-for': 'error',
              'vue-a11y/media-has-caption': 'warn',
              'vue-a11y/mouse-events-have-key-events': 'error',
              'vue-a11y/no-access-key': 'error',
              'vue-a11y/no-aria-hidden-on-focusable': 'error',
              'vue-a11y/no-autofocus': 'warn',
              'vue-a11y/no-distracting-elements': 'error',
              'vue-a11y/no-redundant-roles': 'error',
              'vue-a11y/no-role-presentation-on-focusable': 'error',
              'vue-a11y/no-static-element-interactions': 'error',
              'vue-a11y/role-has-required-aria-props': 'error',
              'vue-a11y/tabindex-no-positive': 'warn',
            }
          : {}),
      },
    },
  ]
}

/** Upstream's `indent` option, reduced to the level `vue/html-indent` takes. */
function indentOf(indent: StylisticIndent | undefined): number | 'tab' {
  if (indent === undefined) {
    return 2
  }
  return Array.isArray(indent) ? indent[0] : indent
}
