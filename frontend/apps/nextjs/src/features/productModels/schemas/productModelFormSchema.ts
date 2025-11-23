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
