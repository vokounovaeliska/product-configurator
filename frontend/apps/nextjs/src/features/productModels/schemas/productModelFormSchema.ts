import { z } from "zod"

import type { TFunction } from "@/types/tFunction"

export const getProductModelFormSchema = (t: TFunction<"ProductModels">) =>
  z.object({
    name: z.string({
      required_error: t("create.errorMessages.nameRequiredMessage"),
    }),
    description: z.string().optional().or(z.literal("")),
  })

export type ProductModelFormSchema = z.infer<ReturnType<typeof getProductModelFormSchema>>

export const getProductModelEditFormSchema = (t: TFunction<"ProductModels">) =>
  z.object({
    name: z.string({
      required_error: t("edit.errorMessages.nameRequiredMessage"),
    }),
    description: z.string().optional().or(z.literal("")),
    price: z
      .number({
        required_error: t("edit.errorMessages.priceRequiredMessage"),
      })
      .min(0, t("edit.errorMessages.priceMinMessage")),
    currency: z.string({
      required_error: t("edit.errorMessages.currencyRequiredMessage"),
    }),
    isActive: z.boolean(),
  })

export type ProductModelEditFormSchema = z.infer<ReturnType<typeof getProductModelEditFormSchema>>
