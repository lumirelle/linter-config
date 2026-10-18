/**
 * The extension's build config: the two browser entry points, bundled into the packable
 * `extension` directory the example's options ignore.
 *
 * A real project calls `defineConfig` from `vite` here. This example does not import it, because
 * examples install no build or runtime package; the root configuration ignores this file for the
 * same reason, and because an example's build config is documentation rather than a lint target.
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
