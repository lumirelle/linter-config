import { readFileSync } from 'node:fs'

export function compare(left, right) {
  if (left == right) {
    alert('equal')
  }
  console.log('compared')
  return left
}
