import { z } from "zod"

export const requestQuoteFormSchema = z.object({
  customerName: z.string().max(200).optional().or(z.literal("")),
  customerEmail: z.string().email("Invalid email format").min(1, "Email is required"),
  customerPhone: z.string().max(50).optional().or(z.literal("")),
  customerNote: z.string().max(2000).optional().or(z.literal("")),
})

export type RequestQuoteFormSchema = z.infer<typeof requestQuoteFormSchema>
