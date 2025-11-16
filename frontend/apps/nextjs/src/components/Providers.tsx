"use client"

import { QueryClientProvider } from "@tanstack/react-query"
import { ReactQueryDevtools } from "@tanstack/react-query-devtools"
import { ThemeProvider as NextThemesProvider } from "next-themes"

import { getQueryClient } from "@/lib/react-query/queryClient"

type Props = {
  children: React.ReactNode
}

export const Providers = ({ children }: Props) => {
  const queryClient = getQueryClient()

  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
      enableColorScheme
    >
      <QueryClientProvider client={queryClient}>
        <ReactQueryDevtools />
        {children}
      </QueryClientProvider>
    </NextThemesProvider>
  )
}
