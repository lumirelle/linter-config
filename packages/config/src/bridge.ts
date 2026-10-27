import type { Linter } from 'eslint'
import type { ConfigObject, Options } from './types'
import { isOxlintConfig } from './oxlint/domains'
import { isTypeAware } from './oxlint/options'
import { mapRules } from './oxlint/rule-map'

/**
 * How a Bridge object is named after the Config object it mirrors.
 *
 * Names are public API, so this is a stable suffix rather than a counter: a resolved config dump
 * shows `lumirelle/vue/rules/oxlint-bridge` the way it shows any other Config object name. The
 * constant stays private: the Bridge is enabled by the `oxlint` option alone, so a consumer never
 * spells a Bridge object's name to append one.
 */
const BRIDGE_NAME_SUFFIX = '/oxlint-bridge'

/**
 * The Bridge: a config object per Config object the Oxlint Emission takes, turning off every rule
 * that Emission reports.
 *
 * The ESLint Adapter calls this with the Config objects `source()` already produced for the same
 * Emission and appends the result through the composer's resolution hook, so the Bridge closes the
 * resolved array whatever the consumer appended. It is never computed from Oxlint's output, and no
 * consumer can call it: {@link Options.oxlint} is the one way to enable it.
 *
 * Its limits follow from what Oxlint is: only rules Oxlint can emit are turned off (a rule in the
 * Coverage report stays on in ESLint, which is the point), each object mirrors the `files` and
 * `ignores` of the Config object it silences so nothing is disabled where Oxlint does not look, and
 * a type-aware rule stays on unless Oxlint runs type-aware (`oxlint: { typeAware: true }`).
 *
 * @param configs - The Config objects the ESLint Emission was built from, in Source order.
 * @param options - The same options object, whose `oxlint` entry selects the type-aware mode.
 * @returns Plain ESLint config objects, in Source order, closing the Emission.
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
