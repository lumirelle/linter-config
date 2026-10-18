import { readFile } from 'node:fs'

export function load(file, next) {
  readFile(file, 'utf8', (err, data) => {
    next(null, data)
  })
}
