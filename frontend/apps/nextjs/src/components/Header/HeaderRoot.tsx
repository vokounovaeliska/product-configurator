import { cn } from "@workspace/ui/lib/utils"

type Props = {
  children: React.ReactNode
}

export const HeaderRoot = ({ children }: Props) => {
  return (
    <header
      className={cn(
        "fixed left-1/2 z-50 mx-auto w-full max-w-7xl -translate-x-1/2 px-4",
        "top-[calc(0.5rem+env(safe-area-inset-top,0px))]",
        "lg:top-4 lg:px-12",
      )}
    >
      <div
        className={cn(
          "flex min-h-[44px] items-center justify-between gap-1 overflow-hidden rounded-full border border-border bg-background/75 px-2 shadow-md backdrop-blur-sm sm:gap-2 sm:px-4",
          "h-10 lg:h-16 lg:gap-2 lg:px-6",
        )}
        style={{ touchAction: "manipulation" }}
      >
        {children}
      </div>
    </header>
  )
}
