import { type DefaultOptions } from "@tanstack/react-query"

export const defaultQueryConfig = {
  queries: { refetchOnWindowFocus: false },
} satisfies DefaultOptions
