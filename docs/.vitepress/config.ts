import type { DefaultTheme } from 'vitepress'
import { fileURLToPath } from 'node:url'
import { transformerTwoslash } from '@shikijs/vitepress-twoslash'
import UnoCSS from 'unocss/vite'
import Components from 'unplugin-vue-components/vite'
import { defineConfig } from 'vitepress'
import {
  groupIconMdPlugin,
  groupIconVitePlugin as GroupIconVitePlugin,
} from 'vitepress-plugin-group-icons'
import { version } from '../../package.json'

const GUIDES: DefaultTheme.NavItemWithLink[] & DefaultTheme.SidebarItem[] = [
  { text: 'Getting Started', link: '/guide/' },
  { text: 'Installation & Usage', link: '/guide/install' },
]

const VERSIONS: (DefaultTheme.NavItemWithLink | DefaultTheme.NavItemChildren)[] = [
  { text: `v${version} (current)`, link: '/' },
  { text: `Release Notes`, link: 'https://github.com/lumirelle/pkg-placeholder/releases' },
  {
    text: `Contributing`,
    link: 'https://github.com/lumirelle/pkg-placeholder/blob/main/CONTRIBUTING.md',
  },
]

export default defineConfig({
  title: '@lumirelle/pkg-placeholder',
  description: '_description_',
  head: [
    // ['meta', { name: 'theme-color', content: '#ffffff' }],
    // ['link', { rel: 'icon', href: '/logo.svg', type: 'image/svg+xml' }],
    ['meta', { name: 'author', content: 'Anthony Fu' }],
    // ['meta', { property: 'og:title', content: '' }],
    // ['meta', { property: 'og:image', content: '' }],
    // ['meta', { property: 'og:description', content: '_description_' }],
    // ['meta', { name: 'twitter:card', content: 'summary_large_image' }],
    // ['meta', { name: 'twitter:image', content: '' }],
    [
      'meta',
      { name: 'viewport', content: 'width=device-width, initial-scale=1.0, viewport-fit=cover' },
    ],
  ],

  themeConfig: {
    // logo: '/logo.svg',
    nav: [
      { text: 'Guide', items: [{ items: GUIDES }] },
      { text: `v${version}`, items: VERSIONS },
    ],
    sidebar: {
      '/': [{ text: 'Guide', items: GUIDES }],
    },
    editLink: {
      pattern: 'https://github.com/lumirelle/pkg-placeholder/edit/main/docs/:path',
      text: 'Suggest changes to this page',
    },
    search: {
      provider: 'local',
    },
    socialLinks: [{ icon: 'github', link: 'https://github.com/lumirelle/pkg-placeholder' }],
    footer: {
      message: 'Released under the MIT License.',
      copyright: 'Copyright © 2025-PRESENT Anthony Fu.',
    },
  },

  cleanUrls: true,

  vite: {
    resolve: {
      tsconfigPaths: true,
    },
    plugins: [
      Components({
        dirs: [fileURLToPath(new URL('components', import.meta.url))],
        dts: fileURLToPath(new URL('../components.d.ts', import.meta.url)),
        include: [/\.vue$/, /\.vue\?vue/, /\.md$/],
        extensions: ['vue', 'md'],
      }),
      UnoCSS(fileURLToPath(new URL('uno.config.ts', import.meta.url))),
      GroupIconVitePlugin(),
    ],
  },

  markdown: {
    theme: {
      light: 'vitesse-light',
      dark: 'vitesse-dark',
    },
    codeTransformers: [transformerTwoslash()],
    languages: ['js', 'jsx', 'ts', 'tsx'],
    config: (md) => {
      md.use(groupIconMdPlugin)
    },
  },
})
