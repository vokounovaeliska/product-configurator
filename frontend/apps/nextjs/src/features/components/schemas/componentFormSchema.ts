import { z } from "zod"

import type { TFunction } from "@/types/tFunction"

export const getComponentFormSchema = (t: TFunction<"Components">) =>
  z.object({
    code: z
      .string({ required_error: t("form.errorMessages.codeRequiredMessage") })
      .min(1, t("form.errorMessages.codeRequiredMessage")),
    label: z
      .string({ required_error: t("form.errorMessages.labelRequiredMessage") })
      .min(1, t("form.errorMessages.labelRequiredMessage")),
    description: z.string().optional().nullable(),
    sortOrder: z.number().int().min(0).optional().nullable(),
  })

export type ComponentFormSchema = z.infer<ReturnType<typeof getComponentFormSchema>>
