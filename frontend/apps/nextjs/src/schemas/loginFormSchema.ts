import { z } from "zod"

import type { TFunction } from "@/types/tFunction"

export const getLoginFormSchema = (t: TFunction<"Login">) =>
  z.object({
    email: z
      .string({ required_error: t("errorMessages.emailRequiredMessage") })
      .email(t("errorMessages.emailInvalidMessage")),
    password: z
      .string({ required_error: t("errorMessages.passwordRequiredMessage") })
      .min(8, t("errorMessages.passwordLengthMessage")),
    rememberMe: z.boolean(),
  })

export type LoginSchema = z.infer<ReturnType<typeof getLoginFormSchema>>
