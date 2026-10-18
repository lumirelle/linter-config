import { join } from 'node:path'

export function assetPath(name) {
  return join('assets', name)
}
