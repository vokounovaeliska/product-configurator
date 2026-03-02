"use client"

import { useMemo } from "react"
import { QueryClientProvider } from "@tanstack/react-query"
import { ThemeProvider as NextThemesProvider } from "next-themes"

import { getQueryClient } from "@/lib/react-query/queryClient"

type Props = {
  children: React.ReactNode
}

export const Providers = ({ children }: Props) => {
  const queryClient = useMemo(() => getQueryClient(), [])

  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
      enableColorScheme
    >
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </NextThemesProvider>
  )
}
