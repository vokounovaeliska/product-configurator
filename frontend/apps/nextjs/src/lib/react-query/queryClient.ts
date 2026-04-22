import { defaultShouldDehydrateQuery, isServer, QueryClient } from "@tanstack/react-query"

import { defaultQueryConfig } from "@/config/react-query"

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      ...defaultQueryConfig,
      dehydrate: {
        shouldDehydrateQuery: (query) =>
          defaultShouldDehydrateQuery(query) || query.state.status === "pending",
      },
    },
  })
}

let browserQueryClient: QueryClient | undefined = undefined

export function getQueryClient() {
  if (isServer) {
    return makeQueryClient()
  } else {
    browserQueryClient ??= makeQueryClient()
    return browserQueryClient
  }
}
