import { z } from "zod"

import type { TFunction } from "@/types/tFunction"

export const getRegistrationFormSchema = (t: TFunction<"Registration">) =>
  z
    .object({
      firstName: z.string({
        required_error: t("errorMessages.firstNameRequiredMessage"),
      }),
      surname: z.string({
        required_error: t("errorMessages.surnameRequiredMessage"),
      }),
      email: z
        .string({ required_error: t("errorMessages.emailRequiredMessage") })
        .email(t("errorMessages.emailInvalidMessage")),
      password: z
        .string({ required_error: t("errorMessages.passwordRequiredMessage") })
        .min(8, t("errorMessages.passwordLengthMessage")),
      confirmPassword: z.string({
        required_error: t("errorMessages.confirmPasswordRequiredMessage"),
      }),
      acceptPrivacy: z.boolean().refine((isAccepted) => isAccepted === true, {
        message: t("errorMessages.privacyRequiredMessage"),
      }),
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: t("errorMessages.passwordsNotMatchMessage"),
      path: ["confirmPassword"],
    })

export type RegistrationSchema = z.infer<ReturnType<typeof getRegistrationFormSchema>>
