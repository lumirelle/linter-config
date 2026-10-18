export interface Basket {
  add: (item: string) => void
  items: string[]
}

export function count(basket: Basket): number {
  return basket.items.length
}
