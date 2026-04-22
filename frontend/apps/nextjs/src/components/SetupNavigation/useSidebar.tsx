"use client"

import { createContext, useContext, useEffect, useState } from "react"

type SidebarContextType = {
  isOpen: boolean
  toggle: () => void
  setIsOpen: (isOpen: boolean) => void
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined)

const SIDEBAR_STORAGE_KEY = "sidebar-open"

export const SidebarProvider = ({ children }: { children: React.ReactNode }) => {
  const [isOpen, setIsOpenState] = useState(true)

  useEffect(() => {
    const stored = localStorage.getItem(SIDEBAR_STORAGE_KEY)
    if (stored !== null) {
      setIsOpenState(stored === "true")
    }
  }, [])

  const setIsOpen = (isOpen: boolean) => {
    setIsOpenState(isOpen)
    localStorage.setItem(SIDEBAR_STORAGE_KEY, String(isOpen))
  }

  const toggle = () => {
    setIsOpen(!isOpen)
  }

  return (
    <SidebarContext.Provider
      value={{
        isOpen,
        toggle,
        setIsOpen,
      }}
    >
      {children}
    </SidebarContext.Provider>
  )
}

export const useSidebar = () => {
  const context = useContext(SidebarContext)
  if (!context) {
    throw new Error("useSidebar must be used within SidebarProvider")
  }
  return context
}
