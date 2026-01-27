"use client"

import { MenuIcon } from "lucide-react"
import { Button } from "@workspace/ui/components/button"

import { useSidebar } from "./useSidebar"

export const SidebarToggle = () => {
  const { isOpen, toggle } = useSidebar()

  // Only show on mobile when sidebar is closed
  if (isOpen) {
    return null
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggle}
      className="fixed top-20 left-4 z-50 lg:hidden"
      aria-label="Open sidebar"
    >
      <MenuIcon className="size-5" />
    </Button>
  )
}
