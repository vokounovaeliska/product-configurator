"use client"

import { useEffect, useState } from "react"

/**
 * Returns true when the media query matches. Uses lg breakpoint (1024px) by default.
 */
export function useMediaQuery(query: string): boolean {
  const [isMatch, setIsMatch] = useState(false)

  useEffect(() => {
    const media = window.matchMedia(query)
    setIsMatch(media.matches)
    const handler = (e: MediaQueryListEvent) => setIsMatch(e.matches)
    media.addEventListener("change", handler)
    return () => media.removeEventListener("change", handler)
  }, [query])

  return isMatch
}
