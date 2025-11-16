import { z } from "zod"

import type { TFunction } from "@/types/tFunction"

export const getRegistrationFormSchema = (t: TFunction<"Registration">) =>
  z.object({
    name: z.string({ required_error: t("errorMessages.nameRequiredMessage") }),
    email: z
      .string({ required_error: t("errorMessages.emailRequiredMessage") })
      .email(t("errorMessages.emailInvalidMessage")),
    password: z
      .string({ required_error: t("errorMessages.passwordRequiredMessage") })
      .min(8, t("errorMessages.passwordLengthMessage")),
  })

export type RegistrationSchema = z.infer<ReturnType<typeof getRegistrationFormSchema>>
