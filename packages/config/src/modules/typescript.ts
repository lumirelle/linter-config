import type { ConfigObject, Options, RuleEntry, RuleKey } from '../types'
import process from 'node:process'
import { GLOB_ASTRO_TS, GLOB_MARKDOWN, GLOB_TS, GLOB_TSX } from '../globs'
import { pluginRef } from '../plugins'

/**
 * Upstream's `configs/typescript.ts`: the TypeScript parser, then the house TypeScript rules.
 *
 * Upstream composes two `@typescript-eslint/eslint-plugin` presets (`configs['eslint-recommended']`
 * overrides and `configs.strict`) and renames their `@typescript-eslint/` prefix to `ts/`. Source
 * imports no plugin package, so the composition is transcribed as data from the version the Plugin
 * Bundle pins (`@typescript-eslint/eslint-plugin` 8.71.2, the `bundle` catalog).
 */
const PRESET_RULES: Record<RuleKey, RuleEntry> = {
  'constructor-super': 'off',
  'getter-return': 'off',
  'no-array-constructor': 'off',
  'no-class-assign': 'off',
  'no-const-assign': 'off',
  'no-dupe-args': 'off',
  'no-dupe-class-members': 'off',
  'no-dupe-keys': 'off',
  'no-func-assign': 'off',
  'no-import-assign': 'off',
  'no-new-native-nonconstructor': 'off',
  'no-new-symbol': 'off',
  'no-obj-calls': 'off',
  'no-redeclare': 'off',
  'no-setter-return': 'off',
  'no-this-before-super': 'off',
  'no-undef': 'off',
  'no-unreachable': 'off',
  'no-unsafe-negation': 'off',
  'no-unused-expressions': 'off',
  'no-unused-vars': 'off',
  'no-useless-constructor': 'off',
  'no-var': 'error',
  'no-with': 'off',
  'prefer-const': 'error',
  'prefer-rest-params': 'error',
  'prefer-spread': 'error',
  'ts/ban-ts-comment': ['error', { minimumDescriptionLength: 10 }],
  'ts/no-array-constructor': 'error',
  'ts/no-duplicate-enum-values': 'error',
  'ts/no-dynamic-delete': 'error',
  'ts/no-empty-object-type': 'error',
  'ts/no-explicit-any': 'error',
  'ts/no-extra-non-null-assertion': 'error',
  'ts/no-extraneous-class': 'error',
  'ts/no-invalid-void-type': 'error',
  'ts/no-misused-new': 'error',
  'ts/no-namespace': 'error',
  'ts/no-non-null-asserted-nullish-coalescing': 'error',
  'ts/no-non-null-asserted-optional-chain': 'error',
  'ts/no-non-null-assertion': 'error',
  'ts/no-require-imports': 'error',
  'ts/no-this-alias': 'error',
  'ts/no-unnecessary-type-constraint': 'error',
  'ts/no-unsafe-declaration-merging': 'error',
  'ts/no-unsafe-function-type': 'error',
  'ts/no-unused-expressions': 'error',
  'ts/no-unused-vars': 'error',
  'ts/no-useless-constructor': 'error',
  'ts/no-wrapper-object-types': 'error',
  'ts/prefer-as-const': 'error',
  'ts/prefer-literal-enum-member': 'error',
  'ts/prefer-namespace-keyword': 'error',
  'ts/triple-slash-reference': 'error',
  'ts/unified-signatures': 'error',
}

/** The house rules, on top of the two presets; every key here wins over the preset value. */
const BASE_RULES: Record<RuleKey, RuleEntry> = {
  ...PRESET_RULES,
  'no-dupe-class-members': 'off',
  'no-redeclare': 'off',
  'no-use-before-define': 'off',
  'no-useless-constructor': 'off',
  'ts/ban-ts-comment': ['error', { 'ts-expect-error': 'allow-with-description' }],
  'ts/consistent-type-definitions': ['error', 'interface'],
  'ts/consistent-type-imports': ['error', {
    disallowTypeAnnotations: false,
    fixStyle: 'separate-type-imports',
    prefer: 'type-imports',
  }],
  // https://www.totaltypescript.com/method-shorthand-syntax-considered-harmful
  'ts/method-signature-style': ['error', 'property'],
  'ts/no-dupe-class-members': 'error',
  'ts/no-dynamic-delete': 'off',
  'ts/no-empty-object-type': ['error', { allowInterfaces: 'always' }],
  'ts/no-explicit-any': 'off',
  'ts/no-extraneous-class': 'off',
  'ts/no-import-type-side-effects': 'error',
  'ts/no-invalid-void-type': 'off',
  'ts/no-non-null-assertion': 'off',
  'ts/no-redeclare': ['error', { builtinGlobals: false }],
  'ts/no-require-imports': 'error',
  'ts/no-unused-expressions': ['error', {
    allowShortCircuit: true,
    allowTaggedTemplates: true,
    allowTernary: true,
  }],
  'ts/no-unused-vars': 'off',
  'ts/no-use-before-define': ['error', { classes: false, functions: false, variables: true }],
  'ts/no-useless-constructor': 'off',
  'ts/no-wrapper-object-types': 'error',
  'ts/triple-slash-reference': 'off',
  'ts/unified-signatures': 'off',
}

/**
 * The rules that need a type checker, so they are emitted only when the caller names a tsconfig.
 *
 * They are also why the Oxlint Emission leaves them out unless `options.oxlint.typeAware` is on;
 * `coverage.json` records that for every rule here.
 */
const TYPE_AWARE_RULES: Record<RuleKey, RuleEntry> = {
  'dot-notation': 'off',
  'no-implied-eval': 'off',
  'ts/await-thenable': 'error',
  'ts/dot-notation': ['error', { allowKeywords: true }],
  'ts/no-floating-promises': 'error',
  'ts/no-for-in-array': 'error',
  'ts/no-implied-eval': 'error',
  'ts/no-misused-promises': 'error',
  'ts/no-unnecessary-type-assertion': 'error',
  'ts/no-unsafe-argument': 'error',
  'ts/no-unsafe-assignment': 'error',
  'ts/no-unsafe-call': 'error',
  'ts/no-unsafe-member-access': 'error',
  'ts/no-unsafe-return': 'error',
  'ts/promise-function-async': 'error',
  'ts/restrict-plus-operands': 'error',
  'ts/restrict-template-expressions': 'error',
  'ts/return-await': ['error', 'in-try-catch'],
  'ts/strict-boolean-expressions': ['error', { allowNullableBoolean: true, allowNullableObject: true }],
  'ts/switch-exhaustiveness-check': 'error',
  'ts/unbound-method': 'error',
}

/** `eslint-plugin-erasable-syntax-only`'s whole rule set, as Upstream enables it. */
const ERASABLE_RULES: Record<RuleKey, RuleEntry> = {
  'erasable-syntax-only/enums': 'error',
  'erasable-syntax-only/export-aliases': 'error',
  'erasable-syntax-only/import-aliases': 'error',
  'erasable-syntax-only/namespaces': 'error',
  'erasable-syntax-only/parameter-properties': 'error',
}

/**
 * The TypeScript Module.
 *
 * Upstream scopes the parser and the TypeScript rules to TypeScript files, so `.js` files keep
 * ESLint's default parser; `componentExts` widens that scope to single-file components.
 */
export function typescript(options: Pick<Options, 'componentExts' | 'type' | 'typescript'> = {}): ConfigObject[] {
  const { componentExts = [], type = 'app' } = options
  const moduleOptions = typeof options.typescript === 'object' ? options.typescript : {}
  // A tsconfig path turns type information on; `erasableOnly` additionally requires strip-able syntax.
  const { erasableOnly = false, tsconfigPath } = moduleOptions
  const isTypeAware = !!tsconfigPath

  const files = [GLOB_TS, GLOB_TSX, ...componentExts.map(ext => `**/*.${ext}`)]
  const filesTypeAware = [GLOB_TS, GLOB_TSX]
  const ignoresTypeAware = [`${GLOB_MARKDOWN}/**`, GLOB_ASTRO_TS]

  const typeAwareParser: ConfigObject[] = isTypeAware
    ? [parserObject('lumirelle/typescript/type-aware-parser', { componentExts, files: filesTypeAware, ignores: ignoresTypeAware, tsconfigPath })]
    : []
  const typeAwareRules: ConfigObject[] = isTypeAware
    ? [{
        name: 'lumirelle/typescript/rules-type-aware',
        module: 'typescript',
        domain: 'js',
        files: filesTypeAware,
        ignores: ignoresTypeAware,
        rules: TYPE_AWARE_RULES,
      }]
    : []
  const erasableSyntaxOnly: ConfigObject[] = erasableOnly
    ? [{
        name: 'lumirelle/typescript/erasable-syntax-only',
        module: 'typescript',
        domain: 'js',
        plugins: { 'erasable-syntax-only': pluginRef('erasable-syntax-only') },
        rules: ERASABLE_RULES,
      }]
    : []

  return [
    {
      // Upstream declares the plugins without globs, so they can be configured separately.
      name: 'lumirelle/typescript/setup',
      module: 'typescript',
      domain: 'js',
      plugins: {
        antfu: pluginRef('antfu'),
        ts: pluginRef('ts'),
      },
    },
    parserObject('lumirelle/typescript/parser', { componentExts, files }),
    ...typeAwareParser,
    {
      name: 'lumirelle/typescript/rules',
      module: 'typescript',
      domain: 'js',
      files,
      rules: {
        ...BASE_RULES,
        ...type === 'lib'
          ? {
              'ts/explicit-function-return-type': ['error', {
                allowExpressions: true,
                allowHigherOrderFunctions: true,
                allowIIFEs: true,
              }],
            }
          : {},
      },
    },
    ...typeAwareRules,
    ...erasableSyntaxOnly,
  ]
}

/**
 * One parser object; the type-aware variant additionally points `projectService` at the tsconfig.
 *
 * `tsconfigRootDir` is the working directory, as Upstream has it: a consumer runs the linter from
 * its project root, so the relative `tsconfigPath` resolves there.
 */
function parserObject(
  name: string,
  options: { componentExts: string[], files: string[], ignores?: string[], tsconfigPath?: string },
): ConfigObject {
  const { componentExts, files, ignores, tsconfigPath } = options

  return {
    name,
    module: 'typescript',
    domain: 'js',
    files,
    ...ignores ? { ignores } : {},
    tools: {
      eslint: {
        parser: pluginRef('ts'),
        languageOptions: {
          parserOptions: {
            extraFileExtensions: componentExts.map(ext => `.${ext}`),
            sourceType: 'module',
            ...tsconfigPath
              ? {
                  projectService: {
                    allowDefaultProject: ['./*.js'],
                    defaultProject: tsconfigPath,
                  },
                  tsconfigRootDir: process.cwd(),
                }
              : {},
          },
        },
      },
    },
  }
}
