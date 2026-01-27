"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useTranslations } from "next-intl"
import { useForm } from "react-hook-form"
import { Button } from "@workspace/ui/components/button"
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
import { Textarea } from "@workspace/ui/components/textarea"

import { useCreateComponent } from "../api/componentQueries"
import { getComponentFormSchema, type ComponentFormSchema } from "../schemas/componentFormSchema"

type Props = {
  productModelId: string
  isOpen: boolean
  onOpenChange: (isOpen: boolean) => void
}

export const CreateComponentDialog = ({ productModelId, isOpen, onOpenChange }: Props) => {
  const t = useTranslations("Components")
  const createComponent = useCreateComponent(productModelId)

  const componentFormSchema = getComponentFormSchema(t)

  const form = useForm({
    defaultValues: {
      code: "",
      label: "",
      description: "",
      sortOrder: 0,
    },
    resolver: zodResolver(componentFormSchema),
  })

  const onSubmit = async (values: ComponentFormSchema) => {
    try {
      await createComponent.mutateAsync({
        code: values.code,
        label: values.label,
        description: values.description ?? null,
        sortOrder: values.sortOrder ?? 0,
      })

      onOpenChange(false)
      form.reset()
    } catch (err) {
      console.error("Failed to create component:", err)
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
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("create.description")}</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder={t("create.descriptionPlaceholder")}
                      rows={4}
                      {...field}
                      value={field.value ?? ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

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

            {createComponent.isError && (
              <div className="rounded-lg bg-destructive/10 p-4 text-destructive">
                {createComponent.error instanceof Error
                  ? createComponent.error.message
                  : t("create.errorMessages.generalError")}
              </div>
            )}

            <Dialog.Content.Footer>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={createComponent.isPending}
              >
                {t("create.cancelButton")}
              </Button>
              <Button
                type="submit"
                disabled={createComponent.isPending}
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
