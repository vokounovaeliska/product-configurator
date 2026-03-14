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
    <>
      {/* Mobile: larger touch target, safe area, z-[60] */}
      <Button
        variant="ghost"
        size="icon"
        onClick={toggle}
        className="fixed z-[60] flex min-h-[44px] min-w-[44px] items-center justify-center lg:hidden"
        style={{
          left: "calc(1rem + env(safe-area-inset-left, 0px))",
          top: "calc(1rem + env(safe-area-inset-top, 0px))",
          touchAction: "manipulation",
        }}
        aria-label="Open sidebar"
      >
        <MenuIcon className="size-5" />
      </Button>
      {/* Desktop: original styling */}
      <Button
        variant="ghost"
        size="icon"
        onClick={toggle}
        className="fixed top-20 left-4 z-50 hidden lg:flex"
        aria-label="Open sidebar"
      >
        <MenuIcon className="size-5" />
      </Button>
    </>
  )
}
