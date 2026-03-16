import { headers } from "next/headers"

import { Header } from "./Header"

const EMBED_PATH_PREFIX = "/e/"

/**
 * Server Component that conditionally renders Header based on pathname.
 * Pathname is set by middleware (x-pathname header) so we avoid importing
 * Header from a Client Component (which would make HeaderMenu async → Client error).
 */
export const HeaderOrNull = async () => {
  const headersList = await headers()
  const pathname = headersList.get("x-pathname") ?? ""
  const isEmbed = pathname.includes(EMBED_PATH_PREFIX)

  if (isEmbed) return null
  return <Header pathname={pathname} />
}
