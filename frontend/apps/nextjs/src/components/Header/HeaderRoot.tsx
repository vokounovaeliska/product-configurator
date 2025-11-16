import { cn } from "@workspace/ui/lib/utils"

type Props = {
  children: React.ReactNode
}

export const HeaderRoot = ({ children }: Props) => {
  return (
    <header
      className={cn(
        "fixed top-2 left-1/2 z-50 mx-auto w-full max-w-7xl -translate-x-1/2 px-4",
        "lg:top-4 lg:px-12",
      )}
    >
      <div
        className={cn(
          "flex h-10 items-center justify-between rounded-full border border-border bg-background/75 px-6 shadow-md backdrop-blur-sm",
          "lg:h-16",
        )}
      >
        {children}
      </div>
    </header>
  )
}
