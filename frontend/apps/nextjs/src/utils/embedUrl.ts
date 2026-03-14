/**
 * Returns the base URL for embed iframes/links, ensuring HTTPS for production
 * to avoid Mixed Content errors (HTTPS page loading HTTP iframe). Keeps HTTP for localhost.
 */
export function getEmbedBaseUrl(siteUrl: string): string {
  const isLocalhost = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?(\/|$)/.test(siteUrl)
  if (isLocalhost) return siteUrl
  return siteUrl.replace(/^http:\/\//, "https://")
}
