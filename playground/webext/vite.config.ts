/**
 * The extension's build config: the two browser entry points, bundled into the packable
 * `extension` directory the example's options ignore.
 *
 * A real project calls `defineConfig` from `vite` here. This example imports nothing, because
 * examples install no build or runtime package, and because the root configuration lints this file
 * as one of the example's own root files rather than leaving it out as documentation.
 */
export default {
  build: {
    outDir: 'extension',
    rollupOptions: {
      input: {
        background: 'src/background.ts',
        'content-script': 'src/content-script.ts',
      },
    },
  },
}
