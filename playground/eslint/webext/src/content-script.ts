import { matchesHost } from './url-match'

// The manifest's content scripts only ever load on the declared hosts.
const DECLARED_HOSTS = ['example.com']

// A content script runs in the page's own context, so it reads the page's own `location` and marks
// the document it was injected into.
if (matchesHost(document.location.href, DECLARED_HOSTS)) {
  document.documentElement.dataset.extensionActive = 'true'
}
