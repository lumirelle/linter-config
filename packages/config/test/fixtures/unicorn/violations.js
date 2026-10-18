export function has(list, value) {
  return list.indexOf(value) !== -1
}

export function copy(source) {
  return new Buffer(source)
}
