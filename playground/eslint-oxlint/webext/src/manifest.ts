/**
 * The extension manifest, as the build writes it to `extension/manifest.json`.
 *
 * The starter keeps this object in `src/manifest.ts` too, and a build script copies it out; the
 * example stops at the typed source, because it installs no build package.
 */
export const manifest = {
  background: { service_worker: 'background.js' },
  content_scripts: [
    {
      js: ['content-script.js'],
      matches: ['https://*.example.com/*'],
    },
  ],
  manifest_version: 3,
  name: 'Example WebExtension',
  permissions: ['storage'],
  version: '0.0.0',
} as const
