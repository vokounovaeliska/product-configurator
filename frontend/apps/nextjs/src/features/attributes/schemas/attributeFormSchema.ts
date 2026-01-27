import { z } from "zod"

import type { TFunction } from "@/types/tFunction"

export const getAttributeFormSchema = (t: TFunction<"Attributes">) => {
  return z
    .object({
      code: z
        .string({ required_error: t("form.errorMessages.codeRequiredMessage") })
        .min(1, t("form.errorMessages.codeRequiredMessage")),
      label: z
        .string({ required_error: t("form.errorMessages.labelRequiredMessage") })
        .min(1, t("form.errorMessages.labelRequiredMessage")),
      type: z.enum(["ENUM", "INTEGER", "DECIMAL", "BOOLEAN"]),
      isRequired: z.boolean().optional().nullable(),
      minInt: z.number().int().optional().nullable(),
      maxInt: z.number().int().optional().nullable(),
      minDecimal: z.number().optional().nullable(),
      maxDecimal: z.number().optional().nullable(),
      sortOrder: z.number().int().min(0).optional().nullable(),
    })
    .refine(
      (data) => {
        // INTEGER: should not have decimal fields
        if (data.type === "INTEGER") {
          return data.minDecimal == null && data.maxDecimal == null
        }
        return true
      },
      {
        message: t("form.errorMessages.integerCannotHaveDecimal"),
        path: ["minDecimal"],
      },
    )
    .refine(
      (data) => {
        // DECIMAL: should not have integer fields
        if (data.type === "DECIMAL") {
          return data.minInt == null && data.maxInt == null
        }
        return true
      },
      {
        message: t("form.errorMessages.decimalCannotHaveInteger"),
        path: ["minInt"],
      },
    )
    .refine(
      (data) => {
        // ENUM/BOOLEAN: should not have numeric fields
        if (data.type === "ENUM" || data.type === "BOOLEAN") {
          return (
            data.minInt == null &&
            data.maxInt == null &&
            data.minDecimal == null &&
            data.maxDecimal == null
          )
        }
        return true
      },
      {
        message: t("form.errorMessages.integerCannotHaveDecimal"),
        path: ["minInt"],
      },
    )
    .refine(
      (data) => {
        // INTEGER: min <= max if both are set
        if (data.type === "INTEGER" && data.minInt != null && data.maxInt != null) {
          return data.minInt <= data.maxInt
        }
        return true
      },
      {
        message: t("form.errorMessages.integerRangeInvalid"),
        path: ["minInt"],
      },
    )
    .refine(
      (data) => {
        // DECIMAL: min <= max if both are set
        if (data.type === "DECIMAL" && data.minDecimal != null && data.maxDecimal != null) {
          return data.minDecimal <= data.maxDecimal
        }
        return true
      },
      {
        message: t("form.errorMessages.decimalRangeInvalid"),
        path: ["minDecimal"],
      },
    )
}

export type AttributeFormSchema = z.infer<ReturnType<typeof getAttributeFormSchema>>
