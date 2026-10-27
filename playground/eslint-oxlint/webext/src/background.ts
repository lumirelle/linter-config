import { matchesHost } from './url-match'

/**
 * The one browser API surface the service worker touches.
 *
 * The example installs no WebExtension typings, the way it installs no framework: the surface it
 * uses is declared here rather than imported from `webextension-polyfill`.
 */
interface ExtensionRuntime {
  onMessage: {
    addListener: (listener: (message: { url: string }) => boolean) => void
  }
}

declare const chrome: { runtime: ExtensionRuntime }

// The manifest's content scripts only ever load on the declared hosts.
const DECLARED_HOSTS = ['example.com']

chrome.runtime.onMessage.addListener(message => matchesHost(message.url, DECLARED_HOSTS))
