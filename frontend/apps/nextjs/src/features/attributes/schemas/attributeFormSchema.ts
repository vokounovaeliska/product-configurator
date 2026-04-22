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
      defaultInt: z.number().int().optional().nullable(),
      defaultDecimal: z.number().optional().nullable(),
      unit: z.string().optional().nullable(),
      sortOrder: z.number().int().min(0).optional().nullable(),
    })
    .refine(
      (data) => {
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
        if (data.type === "ENUM" || data.type === "BOOLEAN") {
          return (
            data.minInt == null &&
            data.maxInt == null &&
            data.minDecimal == null &&
            data.maxDecimal == null &&
            data.defaultInt == null &&
            data.defaultDecimal == null &&
            (data.unit == null || data.unit === "")
          )
        }
        return true
      },
      {
        message: t("form.errorMessages.enumCannotHaveNumericOrUnit"),
        path: ["minInt"],
      },
    )
    .refine(
      (data) => {
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
        if (data.type === "INTEGER" && data.defaultInt != null) {
          if (data.minInt != null && data.defaultInt < data.minInt) return false
          if (data.maxInt != null && data.defaultInt > data.maxInt) return false
        }
        return true
      },
      {
        message: t("form.errorMessages.defaultOutOfRange"),
        path: ["defaultInt"],
      },
    )
    .refine(
      (data) => {
        if (data.type === "DECIMAL" && data.defaultDecimal != null) {
          if (data.minDecimal != null && data.defaultDecimal < data.minDecimal) return false
          if (data.maxDecimal != null && data.defaultDecimal > data.maxDecimal) return false
        }
        return true
      },
      {
        message: t("form.errorMessages.defaultOutOfRange"),
        path: ["defaultDecimal"],
      },
    )
    .refine(
      (data) => {
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
