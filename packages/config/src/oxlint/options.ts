import type { Options, OxlintOptions } from '../types'

/**
 * Oxlint's root `options` field, which has no ESLint counterpart.
 *
 * `options.oxlint` is the Bridge flag in its boolean form and Oxlint's root options in its object
 * form, so this one reading tells both Emissions whether Oxlint runs in its type-aware mode: the
 * Oxlint Adapter emits the field and the Bridge maps rules with the same flag, because a rule the
 * Emission leaves out must stay on in ESLint.
 */
export function oxlintRootOptions(option: Options['oxlint']): OxlintOptions | undefined {
  if (typeof option !== 'object' || option === null) {
    return undefined
  }

  const { typeAware, typeCheck } = option
  const root: OxlintOptions = {
    ...(typeAware === undefined ? {} : { typeAware }),
    ...(typeCheck === undefined ? {} : { typeCheck }),
  }
  return Object.keys(root).length > 0 ? root : undefined
}
