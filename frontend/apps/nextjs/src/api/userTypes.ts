import type { operations } from "@/api/types"

// Auth
export type LoginRequest = operations["userAuthLogin"]["requestBody"]["content"]["application/json"]

export type LoginResponse = operations["userAuthLogin"]["responses"]["200"]["content"]["*/*"]

export type RegistrationRequest =
  operations["userRegistration"]["requestBody"]["content"]["application/json"]

export type RegistrationResponse =
  operations["userRegistration"]["responses"]["200"]["content"]["*/*"]

// Users
type UserDtoFromApi = operations["usersGet"]["responses"]["200"]["content"]["*/*"]
export type UserDto = UserDtoFromApi & {
  notificationEmail?: string | null
}

type UserMeDtoFromApi = operations["usersMe"]["responses"]["200"]["content"]["*/*"]
export type UserMeDto = UserMeDtoFromApi & {
  notificationEmail?: string | null
}

type UserPatchRequestDtoFromApi =
  operations["usersPatch"]["requestBody"]["content"]["application/json"][number]

type NotificationEmailPatch = {
  path: "SlashNotificationEmail"
  op: "Replace"
  value: string | null
}

export type UserPatchRequestDto = UserPatchRequestDtoFromApi | NotificationEmailPatch
