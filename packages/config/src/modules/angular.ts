import type { ConfigObject } from '../types'
import { GLOB_HTML, GLOB_TS } from '../globs'
import { requirePeerPackages } from '../packages'
import { pluginRef } from '../plugins'

/**
 * Upstream's `configs/angular.ts`: the three `@angular-eslint` packages over TypeScript sources
 * and templates.
 *
 * Angular needs a parser and a processor, neither of which Oxlint has, so the Module carries the
 * `angular` Domain and the Oxlint Emission drops it as ESLint-only. All three packages are peers.
 *
 * Upstream routes `overrides` by rule prefix (`angular/*` to the TypeScript object,
 * `angular-template/*` to the template one). Source's override map applies to every object of a
 * Module, so the two plugin sets stay in their own object and an `overrides` entry aimed at this
 * Module has to name rules both objects can see.
 */
export function angular(): ConfigObject[] {
  requirePeerPackages('angular', ['angular', 'angular-template'])

  return [
    {
      name: 'lumirelle/angular/setup',
      module: 'angular',
      domain: 'angular',
      plugins: {
        'angular': pluginRef('angular'),
        'angular-template': pluginRef('angular-template'),
      },
    },
    {
      name: 'lumirelle/angular/rules/ts',
      module: 'angular',
      domain: 'angular',
      files: [GLOB_TS],
      tools: {
        eslint: {
          processor: { plugin: pluginRef('angular-template'), name: 'extract-inline-html' },
        },
      },
      rules: {
        'angular/contextual-lifecycle': 'error',
        'angular/no-empty-lifecycle-method': 'error',
        'angular/no-input-rename': 'error',
        'angular/no-inputs-metadata-property': 'error',
        'angular/no-output-native': 'error',
        'angular/no-output-on-prefix': 'error',
        'angular/no-output-rename': 'error',
        'angular/no-outputs-metadata-property': 'error',
        'angular/prefer-inject': 'error',
        'angular/prefer-standalone': 'error',
        'angular/use-lifecycle-interface': 'error',
        'angular/use-pipe-transform-interface': 'error',
      },
    },
    {
      name: 'lumirelle/angular/rules/template',
      module: 'angular',
      domain: 'angular',
      files: [GLOB_HTML],
      tools: {
        eslint: {
          parser: pluginRef('angular-template'),
        },
      },
      rules: {
        'angular-template/banana-in-box': 'error',
        'angular-template/eqeqeq': 'error',
        'angular-template/no-negated-async': 'error',
        'angular-template/prefer-control-flow': 'error',
        // Inline templates keep their own indentation, so the style rules step aside.
        'style/indent': 'off',
        'style/no-multiple-empty-lines': ['error', { max: 1 }],
        'style/no-trailing-spaces': 'off',
      },
    },
  ]
}
