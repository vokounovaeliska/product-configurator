import { z } from "zod"

export const pricingRuleFormSchema = z.object({
  componentId: z.string(),
  attributeCode: z.string().min(1),
  operator: z.enum(["EQ", "BETWEEN"]),
  value: z.string().min(1),
  toValue: z.string().nullable(),
  priceDeltaCents: z.number().int().min(0),
  pricePerUnitCents: z.number().int().min(0).nullable(),
})

export type PricingRuleFormSchema = z.infer<typeof pricingRuleFormSchema>
