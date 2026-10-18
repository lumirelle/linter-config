import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: ['src/eslint.ts', 'src/oxlint.ts'],
  format: 'esm',
  dts: true,
  clean: true,
})
