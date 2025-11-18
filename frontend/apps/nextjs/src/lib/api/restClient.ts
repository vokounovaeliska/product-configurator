import ky from "ky"

import { env } from "@/config/env"

import { getAuthCookies } from "../auth/authCookies"

export const api = ky.create({
  prefixUrl: `${env.NEXT_PUBLIC_REST_API_URL}/api`,
  hooks: {
    beforeRequest: [
      async (request) => {
        const authCookies = await getAuthCookies()

        request.headers.set("cookie", authCookies)
      },
    ],
  },
})
