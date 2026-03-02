import { type DefaultOptions } from "@tanstack/react-query"

export const defaultQueryConfig = {
  queries: {
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    refetchInterval: false,
    staleTime: Number.POSITIVE_INFINITY, // Never consider data stale; prevents automatic refetches
  },
} satisfies DefaultOptions
