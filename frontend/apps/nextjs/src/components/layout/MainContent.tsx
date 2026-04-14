import { headers } from "next/headers"
import { cn } from "@workspace/ui/lib/utils"

const EMBED_PATH_MARKER = "/e/"

type Props = {
  children: React.ReactNode
}

/**
 * Embed routes skip the fixed header; without adjusting padding the main area keeps a 4rem
 * top gap and the configurator uses negative margins. Use compact, viewport-height-aware padding
 * so the iframe shows a full-screen layout with a single page scroll (no nested column scroll).
 */
export const MainContent = async ({ children }: Props) => {
  const pathname = (await headers()).get("x-pathname") ?? ""
  const isEmbed = pathname.includes(EMBED_PATH_MARKER)

  return (
    <main
      className={cn(
        "flex min-h-0 flex-1 flex-col",
        isEmbed
          ? "min-h-dvh px-0 pt-[max(0.5rem,env(safe-area-inset-top,0px))] pb-0"
          : cn(
              "px-4 py-4",
              "pt-[calc(4rem+env(safe-area-inset-top,0px))]",
              "sm:p-6 lg:p-12 lg:pt-30",
            ),
      )}
    >
      {children}
    </main>
  )
}
