"use server"

import type { ResponseCookie } from "next/dist/compiled/@edge-runtime/cookies"
import { cookies } from "next/headers"

export const getCookie = async (name: string) => {
  const cookieStore = await cookies()

  return cookieStore.get(name)
}

export const setCookie = async (name: string, value: string, options?: Partial<ResponseCookie>) => {
  const cookieStore = await cookies()
  cookieStore.set(name, value, options)
}
