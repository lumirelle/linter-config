import type { Linter } from 'eslint'
import type { ConfigObject, Options } from './types'
import { isOxlintConfig } from './oxlint/domains'
import { isTypeAware } from './oxlint/options'
import { mapRules } from './oxlint/rule-map'
import { source } from './source'

/**
 * How a Bridge object is named after the Config object it mirrors.
 *
 * Names are public API, so this is a stable suffix rather than a counter: a consumer can address
 * one Bridge object (`lumirelle/vue/rules/oxlint-bridge`) the way it addresses any other.
 */
export const BRIDGE_NAME_SUFFIX = '/oxlint-bridge'

/**
 * The ESLint side of running both tools over the same files: a config object per Config object the
 * Oxlint Emission takes, turning off every rule that Emission reports.
 *
 * Consumers who run both tools get this appended by `eslint({ oxlint: true })`. The reason it is
 * also exported is order: a consumer's own configs come after ours and may turn a rule back on, so
 * the Bridge has to be appended last — `eslint().append(...oxlintBridge(options))` with the same
 * options the Oxlint side got. Appending it twice is harmless, since `off` over `off` is the same.
 *
 * Its limits follow from what Oxlint is: only rules Oxlint can emit are turned off (a rule in the
 * Coverage report stays on in ESLint, which is the point), each object mirrors the `files` and
 * `ignores` of the Config object it silences so nothing is disabled where Oxlint does not look, and
 * a type-aware rule stays on unless Oxlint runs type-aware (`oxlint: { typeAware: true }`).
 *
 * @param options - The options the Oxlint side was built with; `oxlint` selects the type-aware mode.
 * @returns Plain ESLint config objects, in Source order, ready to append to a composer.
 */
export function oxlintBridge(options: Options = {}): Linter.Config[] {
  return bridgeObjects(source(options), options)
}

/**
 * The Bridge for Config objects that were already composed.
 *
 * The ESLint Adapter already holds them, so it passes them here instead of paying for a second
 * `source()`; the Bridge is computed from those objects either way, never from Oxlint's output.
 */
export function bridgeObjects(configs: readonly ConfigObject[], options: Options = {}): Linter.Config[] {
  const typeAware = isTypeAware(options)

  return configs
    .filter(config => isOxlintConfig(config))
    .flatMap((config): Linter.Config[] => {
      const { emitted } = mapRules(config.rules, { typeAware })
      if (emitted.length === 0) {
        return []
      }

      return [{
        name: `${config.name}${BRIDGE_NAME_SUFFIX}`,
        ...(config.files ? { files: config.files } : {}),
        ...(config.ignores ? { ignores: config.ignores } : {}),
        rules: Object.fromEntries(emitted.map(key => [key, 'off' as const])),
      }]
    })
}

/** Whether {@link Options.oxlint} asks for the Bridge: the boolean form is the flag, the object form carries Oxlint's options. */
export function isBridgeEnabled(option: Options['oxlint']): boolean {
  return option !== undefined && option !== false
}
