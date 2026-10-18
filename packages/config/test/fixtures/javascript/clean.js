export const sum = (left, right) => left + right

export function greet(name) {
  if (name === '') {
    return 'hello, stranger'
  }
  return `hello, ${name}`
}

export class Basket {
  items = []

  add(item) {
    this.items.push(item)
    return this
  }
}
