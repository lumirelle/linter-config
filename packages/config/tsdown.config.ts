import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: ['src/index.ts', 'src/eslint.ts', 'src/oxlint.ts'],
  format: 'esm',
  dts: true,
  clean: true,
})
