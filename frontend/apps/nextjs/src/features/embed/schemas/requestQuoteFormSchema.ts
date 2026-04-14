import { z } from "zod"

import type { TFunction } from "@/types/tFunction"

export const getRequestQuoteFormSchema = (t: TFunction<"Embed">) =>
  z.object({
    customerName: z.string().max(200).optional().or(z.literal("")),
    customerEmail: z
      .string()
      .min(1, t("requestQuoteDialog.errorMessages.emailRequired"))
      .email(t("requestQuoteDialog.errorMessages.emailInvalid")),
    customerPhone: z.string().max(50).optional().or(z.literal("")),
    customerNote: z.string().max(2000).optional().or(z.literal("")),
    acceptDataProcessing: z.boolean().refine((isAccepted) => isAccepted === true, {
      message: t("requestQuoteDialog.errorMessages.dataProcessingRequired"),
    }),
  })

export type RequestQuoteFormSchema = z.infer<ReturnType<typeof getRequestQuoteFormSchema>>
