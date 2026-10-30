import type { Linter } from 'eslint'
import type { ConfigObject, Options } from './types'
import { isOxlintConfig } from './oxlint/domains'
import { isTypeAware } from './oxlint/options'
import { mapRules } from './oxlint/rule-map'

const BRIDGE_NAME_SUFFIX = '/oxlint-bridge'

/**
 * The Bridge: a config object per Config object the Oxlint Emission takes, turning off every rule
 * that Emission reports.
 *
 * The ESLint Adapter calls this with the Config objects `source()` already produced for the same
 * Emission and appends the result through the composer's resolution hook, so the Bridge closes the
 * resolved array whatever the consumer appended.
 *
 * LIMITATION: Its limits follow from what Oxlint is: only rules Oxlint can support are turned off, and
 * a type-aware rule stays on unless Oxlint runs type-aware (`oxlint: { typeAware: true }`).
 *
 * @param configs - Source's Config objects for the same options.
 * @param options - The same options object.
 * @returns Plain ESLint config objects, in Source order, closing the rule emission.
 */
export function bridgeObjects(configs: readonly ConfigObject[], options: Options): Linter.Config[] {
  const typeAware = isTypeAware(options)

  return configs
    .filter(config => isOxlintConfig(config))
    .flatMap((config): Linter.Config[] => {
      const { emitted } = mapRules(config.rules, { typeAware })
      if (emitted.length === 0) {
        return []
      }

      return [
        {
          name: `${config.name}${BRIDGE_NAME_SUFFIX}`,
          ...(config.files ? { files: config.files } : {}),
          ...(config.ignores ? { ignores: config.ignores } : {}),
          rules: Object.fromEntries(emitted.map(key => [key, 'off' as const])),
        },
      ]
    })
}

/** Whether {@link Options.oxlint} asks for the Bridge: the boolean form is the flag, the object form carries Oxlint's options. */
export function isBridgeEnabled(option: Options['oxlint']): boolean {
  return option !== undefined && option !== false
}

export function renameBridge(
  bridge: readonly Linter.Config[],
  resolved: readonly Linter.Config[],
): Linter.Config[] {
  const byName = new Map(resolved.map(config => [config.name, config]))

  return bridge.map(object => {
    const mirrored =
      object.name === undefined
        ? undefined
        : byName.get(object.name.slice(0, -BRIDGE_NAME_SUFFIX.length))
    const keys = Object.keys(mirrored?.rules ?? {})

    return {
      ...object,
      rules: Object.fromEntries(
        Object.entries(object.rules ?? {}).map(([key, severity]) => {
          // A core rule's key has no prefix to rename, and an unchanged key needs no lookup.
          const suffix = key.slice(key.indexOf('/'))
          if (!key.includes('/') || keys.includes(key)) {
            return [key, severity]
          }

          const renamed = keys.filter(candidate => candidate.endsWith(suffix))
          return [renamed.length === 1 ? renamed[0]! : key, severity]
        }),
      ),
    }
  })
}
