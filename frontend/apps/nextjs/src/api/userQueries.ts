import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import type { UserDto, UserPatchRequestDto } from "@/api/userTypes"
import { api } from "@/lib/api/restClient"

export const userKeys = {
  all: ["user"] as const,
  me: () => [...userKeys.all, "me"] as const,
}

export const getCurrentUserQueryOptions = () =>
  ({
    queryKey: userKeys.me(),
    queryFn: async (): Promise<UserDto> => api.get("users/api/v1/users/me").json<UserDto>(),
  }) as const

export const useCurrentUser = () => useQuery(getCurrentUserQueryOptions())

type PatchCurrentUserParams = {
  userId: string
  patches: UserPatchRequestDto[]
}

export const usePatchCurrentUser = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ userId, patches }: PatchCurrentUserParams): Promise<UserDto> =>
      api.patch(`users/api/v1/users/${userId}`, { json: patches }).json<UserDto>(),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: userKeys.me() })
    },
  })
}
