export function getEmbedBaseUrl(siteUrl: string): string {
  const isLocalhost = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?(\/|$)/.test(siteUrl)
  if (isLocalhost) return siteUrl
  return siteUrl.replace(/^http:\/\//, "https://")
}
