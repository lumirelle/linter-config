/**
 * Whether a URL's host is one the manifest declares, or a subdomain of one.
 *
 * The service worker and the content script both call this, so a page the manifest does not cover
 * reaches neither.
 */
export function matchesHost(url: string, hosts: readonly string[]): boolean {
  if (!URL.canParse(url)) {
    return false
  }

  const { hostname } = new URL(url)
  return hosts.some(host => hostname === host || hostname.endsWith(`.${host}`))
}
