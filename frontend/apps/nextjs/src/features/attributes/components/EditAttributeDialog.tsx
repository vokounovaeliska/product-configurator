"use client"

import { useEffect } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useTranslations } from "next-intl"
import { useForm } from "react-hook-form"
import { Button } from "@workspace/ui/components/button"
import { Checkbox } from "@workspace/ui/components/checkbox"
import { Dialog } from "@workspace/ui/components/dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@workspace/ui/components/form"
import { Input } from "@workspace/ui/components/input"
import { Select } from "@workspace/ui/components/select"

import type { AttributeDto, AttributePatchRequestDto } from "@/api/attributeTypes"

import { useUpdateAttribute } from "../api/attributeQueries"
import { getAttributeFormSchema, type AttributeFormSchema } from "../schemas/attributeFormSchema"

type Props = {
  attribute: AttributeDto
  productModelId: string
  componentId: string
  isOpen: boolean
  onOpenChange: (isOpen: boolean) => void
}

export const EditAttributeDialog = ({
  attribute,
  productModelId,
  componentId,
  isOpen,
  onOpenChange,
}: Props) => {
  const t = useTranslations("Attributes")
  const updateAttribute = useUpdateAttribute(productModelId, componentId)

  const attributeFormSchema = getAttributeFormSchema(t)

  const form = useForm<AttributeFormSchema>({
    defaultValues: {
      code: attribute.code,
      label: attribute.label,
      type: attribute.type,
      isRequired: attribute.isRequired,
      minInt: attribute.minInt,
      maxInt: attribute.maxInt,
      minDecimal: attribute.minDecimal,
      maxDecimal: attribute.maxDecimal,
      unit: attribute.unit ?? null,
      sortOrder: attribute.sortOrder,
    },
    resolver: zodResolver(attributeFormSchema),
  })

  const selectedType = form.watch("type")

  useEffect(() => {
    if (isOpen) {
      form.reset({
        code: attribute.code,
        label: attribute.label,
        type: attribute.type,
        isRequired: attribute.isRequired,
        minInt: attribute.minInt,
        maxInt: attribute.maxInt,
        minDecimal: attribute.minDecimal,
        maxDecimal: attribute.maxDecimal,
        unit: attribute.unit ?? null,
        sortOrder: attribute.sortOrder,
      })
    }
  }, [attribute, isOpen, form])

  const onSubmit = async (values: AttributeFormSchema) => {
    try {
      const patches: AttributePatchRequestDto[] = []

      if (values.code !== attribute.code) {
        patches.push({ path: "/code", op: "Replace" as const, value: values.code })
      }
      if (values.label !== attribute.label) {
        patches.push({ path: "/label", op: "Replace" as const, value: values.label })
      }
      if (values.type !== attribute.type) {
        patches.push({ path: "/type", op: "Replace" as const, value: values.type })
      }
      if (values.isRequired !== attribute.isRequired) {
        patches.push({
          path: "/isRequired",
          op: "Replace" as const,
          value: values.isRequired ?? true,
        })
      }
      if (values.sortOrder !== attribute.sortOrder) {
        patches.push({
          path: "/sortOrder",
          op: "Replace" as const,
          value: values.sortOrder ?? 0,
        })
      }

      // INTEGER fields
      if (values.type === "INTEGER") {
        if (values.minInt !== attribute.minInt) {
          patches.push({ path: "/minInt", op: "Replace" as const, value: values.minInt })
        }
        if (values.maxInt !== attribute.maxInt) {
          patches.push({ path: "/maxInt", op: "Replace" as const, value: values.maxInt })
        }
      }

      // DECIMAL fields
      if (values.type === "DECIMAL") {
        if (values.minDecimal !== attribute.minDecimal) {
          patches.push({
            path: "/minDecimal",
            op: "Replace" as const,
            value: values.minDecimal,
          })
        }
        if (values.maxDecimal !== attribute.maxDecimal) {
          patches.push({
            path: "/maxDecimal",
            op: "Replace" as const,
            value: values.maxDecimal,
          })
        }
      }

      // Unit (INTEGER or DECIMAL)
      if (values.type === "INTEGER" || values.type === "DECIMAL") {
        const newUnit = values.unit?.trim() ?? null
        if (newUnit !== (attribute.unit ?? null)) {
          patches.push({
            path: "/unit",
            op: "Replace" as const,
            value: newUnit,
          })
        }
      }

      if (patches.length > 0) {
        await updateAttribute.mutateAsync({
          attributeId: attribute.id,
          patches,
        })
      }

      onOpenChange(false)
    } catch (err) {
      console.error("Failed to update attribute:", err)
    }
  }

  return (
    <Dialog
      open={isOpen}
      onOpenChange={onOpenChange}
    >
      <Dialog.Content>
        <Dialog.Content.Header>
          <Dialog.Content.Header.Title>{t("edit.title")}</Dialog.Content.Header.Title>
          <Dialog.Content.Header.Description>
            {t("edit.description")}
          </Dialog.Content.Header.Description>
        </Dialog.Content.Header>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4"
          >
            <FormField
              control={form.control}
              name="code"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("edit.code")}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t("edit.codePlaceholder")}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="label"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("edit.label")}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t("edit.labelPlaceholder")}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("edit.type")}</FormLabel>
                  <Select
                    value={field.value}
                    onValueChange={(value) => {
                      field.onChange(value)
                      // Reset numeric fields when type changes
                      if (value === "ENUM" || value === "BOOLEAN") {
                        form.setValue("minInt", null)
                        form.setValue("maxInt", null)
                        form.setValue("minDecimal", null)
                        form.setValue("maxDecimal", null)
                      } else if (value === "INTEGER") {
                        form.setValue("minDecimal", null)
                        form.setValue("maxDecimal", null)
                      } else if (value === "DECIMAL") {
                        form.setValue("minInt", null)
                        form.setValue("maxInt", null)
                      }
                    }}
                  >
                    <FormControl>
                      <Select.Trigger>
                        <Select.Trigger.Value placeholder={t("edit.typePlaceholder")} />
                      </Select.Trigger>
                    </FormControl>
                    <Select.Content>
                      <Select.Content.Item value="ENUM">{t("edit.typeEnum")}</Select.Content.Item>
                      <Select.Content.Item value="INTEGER">
                        {t("edit.typeInteger")}
                      </Select.Content.Item>
                      <Select.Content.Item value="DECIMAL">
                        {t("edit.typeDecimal")}
                      </Select.Content.Item>
                      <Select.Content.Item value="BOOLEAN">
                        {t("edit.typeBoolean")}
                      </Select.Content.Item>
                    </Select.Content>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="isRequired"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-y-0 space-x-3">
                  <FormControl>
                    <Checkbox
                      checked={field.value ?? true}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>{t("edit.isRequired")}</FormLabel>
                  </div>
                </FormItem>
              )}
            />

            {/* INTEGER type fields */}
            {selectedType === "INTEGER" && (
              <>
                <FormField
                  control={form.control}
                  name="minInt"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("edit.minInt")}</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder={t("edit.minIntPlaceholder")}
                          {...field}
                          value={field.value ?? ""}
                          onChange={(e) =>
                            field.onChange(
                              e.target.value === "" ? null : Number.parseInt(e.target.value, 10),
                            )
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="maxInt"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("edit.maxInt")}</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder={t("edit.maxIntPlaceholder")}
                          {...field}
                          value={field.value ?? ""}
                          onChange={(e) =>
                            field.onChange(
                              e.target.value === "" ? null : Number.parseInt(e.target.value, 10),
                            )
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="unit"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("edit.unit")}</FormLabel>
                      <FormControl>
                        <Input
                          placeholder={t("edit.unitPlaceholder")}
                          {...field}
                          value={field.value ?? ""}
                          onChange={(e) =>
                            field.onChange(e.target.value === "" ? null : e.target.value)
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}

            {/* DECIMAL type fields */}
            {selectedType === "DECIMAL" && (
              <>
                <FormField
                  control={form.control}
                  name="minDecimal"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("edit.minDecimal")}</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder={t("edit.minDecimalPlaceholder")}
                          {...field}
                          value={field.value ?? ""}
                          onChange={(e) =>
                            field.onChange(
                              e.target.value === "" ? null : Number.parseFloat(e.target.value),
                            )
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="maxDecimal"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("edit.maxDecimal")}</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder={t("edit.maxDecimalPlaceholder")}
                          {...field}
                          value={field.value ?? ""}
                          onChange={(e) =>
                            field.onChange(
                              e.target.value === "" ? null : Number.parseFloat(e.target.value),
                            )
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="unit"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("edit.unit")}</FormLabel>
                      <FormControl>
                        <Input
                          placeholder={t("edit.unitPlaceholder")}
                          {...field}
                          value={field.value ?? ""}
                          onChange={(e) =>
                            field.onChange(e.target.value === "" ? null : e.target.value)
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}

            <FormField
              control={form.control}
              name="sortOrder"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("edit.sortOrder")}</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="0"
                      {...field}
                      value={field.value ?? 0}
                      onChange={(e) => field.onChange(Number.parseInt(e.target.value, 10) || 0)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {updateAttribute.isError && (
              <div className="rounded-lg bg-destructive/10 p-4 text-destructive">
                {updateAttribute.error instanceof Error
                  ? updateAttribute.error.message
                  : t("edit.errorMessages.generalError")}
              </div>
            )}

            <Dialog.Content.Footer>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={updateAttribute.isPending}
              >
                {t("edit.cancelButton")}
              </Button>
              <Button
                type="submit"
                disabled={updateAttribute.isPending}
              >
                {t("edit.submitButton")}
              </Button>
            </Dialog.Content.Footer>
          </form>
        </Form>
      </Dialog.Content>
    </Dialog>
  )
}
