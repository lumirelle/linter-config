export type Point = {
  x: number
  y: number
}

export interface Service {
  run(): void
}

// @ts-ignore
export const origin: Point = { x: 0, y: 0 }
