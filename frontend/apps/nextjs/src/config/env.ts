import { createEnv } from "@t3-oss/env-nextjs"
import { z } from "zod"

export const env = createEnv({
  server: {
    ENV_NAME: z.enum(["local", "staging", "production"]).optional().default("local"),
  },
  client: {
    NEXT_PUBLIC_SITE_URL: z.string().url(),
    NEXT_PUBLIC_BE_URL: z.string().url(),
    NEXT_PUBLIC_REST_API_URL: z.string().url(),
  },
  runtimeEnv: {
    ENV_NAME: process.env.ENV_NAME,
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
    NEXT_PUBLIC_BE_URL: process.env.NEXT_PUBLIC_BE_URL,
    NEXT_PUBLIC_REST_API_URL: process.env.NEXT_PUBLIC_REST_API_URL,
  },
})
