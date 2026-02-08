"use client"

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

import { DualRangeSlider } from "@/components/DualRangeSlider"

import { useCreateAttribute } from "../api/attributeQueries"
import { getAttributeFormSchema, type AttributeFormSchema } from "../schemas/attributeFormSchema"

type Props = {
  productModelId: string
  componentId: string
  isOpen: boolean
  onOpenChange: (isOpen: boolean) => void
}

export const CreateAttributeDialog = ({
  productModelId,
  componentId,
  isOpen,
  onOpenChange,
}: Props) => {
  const t = useTranslations("Attributes")
  const createAttribute = useCreateAttribute(productModelId, componentId)

  const attributeFormSchema = getAttributeFormSchema(t)

  const form = useForm<AttributeFormSchema>({
    defaultValues: {
      code: "",
      label: "",
      type: "INTEGER",
      isRequired: true,
      minInt: null,
      maxInt: null,
      minDecimal: null,
      maxDecimal: null,
      unit: null,
      sortOrder: 0,
    },
    resolver: zodResolver(attributeFormSchema),
  })

  const selectedType = form.watch("type")

  const onSubmit = async (values: AttributeFormSchema) => {
    try {
      await createAttribute.mutateAsync({
        code: values.code,
        label: values.label,
        type: values.type,
        isRequired: values.isRequired ?? true,
        minInt: values.type === "INTEGER" ? values.minInt : null,
        maxInt: values.type === "INTEGER" ? values.maxInt : null,
        minDecimal: values.type === "DECIMAL" ? values.minDecimal : null,
        maxDecimal: values.type === "DECIMAL" ? values.maxDecimal : null,
        unit:
          values.type === "INTEGER" || values.type === "DECIMAL"
            ? (values.unit?.trim() ?? null)
            : null,
        sortOrder: values.sortOrder ?? 0,
      })

      onOpenChange(false)
      form.reset()
    } catch (err) {
      console.error("Failed to create attribute:", err)
    }
  }

  return (
    <Dialog
      open={isOpen}
      onOpenChange={onOpenChange}
    >
      <Dialog.Content>
        <Dialog.Content.Header>
          <Dialog.Content.Header.Title>{t("create.title")}</Dialog.Content.Header.Title>
          <Dialog.Content.Header.Description>
            {t("create.description")}
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
                  <FormLabel>{t("create.code")}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t("create.codePlaceholder")}
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
                  <FormLabel>{t("create.label")}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t("create.labelPlaceholder")}
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
                  <FormLabel>{t("create.type")}</FormLabel>
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
                        <Select.Trigger.Value placeholder={t("create.typePlaceholder")} />
                      </Select.Trigger>
                    </FormControl>
                    <Select.Content>
                      <Select.Content.Item value="ENUM">{t("create.typeEnum")}</Select.Content.Item>
                      <Select.Content.Item value="INTEGER">
                        {t("create.typeInteger")}
                      </Select.Content.Item>
                      <Select.Content.Item value="DECIMAL">
                        {t("create.typeDecimal")}
                      </Select.Content.Item>
                      <Select.Content.Item value="BOOLEAN">
                        {t("create.typeBoolean")}
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
                    <FormLabel>{t("create.isRequired")}</FormLabel>
                  </div>
                </FormItem>
              )}
            />

            {/* INTEGER type fields */}
            {selectedType === "INTEGER" && (
              <>
                <div className="space-y-2">
                  <FormLabel>
                    {t("create.minInt")} – {t("create.maxInt")}
                  </FormLabel>
                  <DualRangeSlider
                    min={0}
                    max={10000}
                    step={1}
                    fromValue={form.watch("minInt") ?? 0}
                    toValue={form.watch("maxInt") ?? 10000}
                    onFromChange={(v) => form.setValue("minInt", v)}
                    onToChange={(v) => form.setValue("maxInt", v)}
                    minLabel={t("create.minInt")}
                    maxLabel={t("create.maxInt")}
                  />
                  {(form.formState.errors.minInt ?? form.formState.errors.maxInt) && (
                    <p className="text-sm font-medium text-destructive">
                      {form.formState.errors.minInt?.message ??
                        form.formState.errors.maxInt?.message}
                    </p>
                  )}
                </div>

                <FormField
                  control={form.control}
                  name="unit"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("create.unit")}</FormLabel>
                      <FormControl>
                        <Input
                          placeholder={t("create.unitPlaceholder")}
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
                <div className="space-y-2">
                  <FormLabel>
                    {t("create.minDecimal")} – {t("create.maxDecimal")}
                  </FormLabel>
                  <DualRangeSlider
                    min={0}
                    max={100}
                    step={0.01}
                    fromValue={form.watch("minDecimal") ?? 0}
                    toValue={form.watch("maxDecimal") ?? 100}
                    onFromChange={(v) => form.setValue("minDecimal", v)}
                    onToChange={(v) => form.setValue("maxDecimal", v)}
                    minLabel={t("create.minDecimal")}
                    maxLabel={t("create.maxDecimal")}
                  />
                  {(form.formState.errors.minDecimal ?? form.formState.errors.maxDecimal) && (
                    <p className="text-sm font-medium text-destructive">
                      {form.formState.errors.minDecimal?.message ??
                        form.formState.errors.maxDecimal?.message}
                    </p>
                  )}
                </div>

                <FormField
                  control={form.control}
                  name="unit"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("create.unit")}</FormLabel>
                      <FormControl>
                        <Input
                          placeholder={t("create.unitPlaceholder")}
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
                  <FormLabel>{t("create.sortOrder")}</FormLabel>
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

            {createAttribute.isError && (
              <div className="rounded-lg bg-destructive/10 p-4 text-destructive">
                {createAttribute.error instanceof Error
                  ? createAttribute.error.message
                  : t("create.errorMessages.generalError")}
              </div>
            )}

            <Dialog.Content.Footer>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={createAttribute.isPending}
              >
                {t("create.cancelButton")}
              </Button>
              <Button
                type="submit"
                disabled={createAttribute.isPending}
              >
                {t("create.submitButton")}
              </Button>
            </Dialog.Content.Footer>
          </form>
        </Form>
      </Dialog.Content>
    </Dialog>
  )
}
