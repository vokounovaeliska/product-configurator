import type { operations } from "@/api/types"

// Auth
export type LoginRequest = operations["userAuthLogin"]["requestBody"]["content"]["application/json"]

export type LoginResponse = operations["userAuthLogin"]["responses"]["200"]["content"]["*/*"]

export type RegistrationRequest =
  operations["userRegistration"]["requestBody"]["content"]["application/json"]

export type RegistrationResponse =
  operations["userRegistration"]["responses"]["200"]["content"]["*/*"]

// Users
export type UserDto = operations["usersGet"]["responses"]["200"]["content"]["*/*"]

export type UserMeDto = operations["usersMe"]["responses"]["200"]["content"]["*/*"]
