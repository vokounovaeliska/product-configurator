"use client"

import { MenuIcon } from "lucide-react"
import { Button } from "@workspace/ui/components/button"
import { cn } from "@workspace/ui/lib/utils"

import { useSidebar } from "./useSidebar"

export const SidebarToggle = () => {
  const { isOpen, toggle } = useSidebar()

  if (isOpen) {
    return null
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggle}
      className={cn("flex size-9 min-h-9 min-w-9 shrink-0 items-center justify-center lg:size-9")}
      style={{ touchAction: "manipulation" }}
      aria-label="Open sidebar"
    >
      <MenuIcon className="size-5" />
    </Button>
  )
}
