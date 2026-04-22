"use client"

import { useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { AlertCircleIcon } from "lucide-react"
import { useTranslations } from "next-intl"
import { useForm } from "react-hook-form"
import { Button } from "@workspace/ui/components/button"
import { Checkbox } from "@workspace/ui/components/checkbox"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@workspace/ui/components/form"
import { Input } from "@workspace/ui/components/input"
import { Typography } from "@workspace/ui/components/typography"
import { cn } from "@workspace/ui/lib/utils"

import { PasswordInput } from "@/components/PasswordInput"
import { useAuth } from "@/hooks/useAuth"
import { publicApi } from "@/lib/api/restClient"
import { Link } from "@/lib/i18n/navigation"
import { ROUTES } from "@/lib/routes"
import { extractErrorMessage } from "@/lib/utils"

import {
  getRegistrationFormSchema,
  type RegistrationSchema,
} from "@/features/auth/schemas/registrationFormSchema"

export const RegistrationForm = () => {
  const [error, setError] = useState<string | null>(null)

  const t = useTranslations("Registration")
  const { signIn } = useAuth()

  const registrationFormSchema = getRegistrationFormSchema(t)

  const form = useForm({
    defaultValues: {
      firstName: "",
      surname: "",
      email: "",
      password: "",
      confirmPassword: "",
      acceptPrivacy: false,
    },
    resolver: zodResolver(registrationFormSchema),
  })

  const onSubmit = async (values: RegistrationSchema) => {
    setError(null)

    try {
      await publicApi
        .post("users/api/v1/auth/public/register", {
          json: {
            firstName: values.firstName,
            surname: values.surname,
            email: values.email,
            password: values.password,
            confirmPassword: values.confirmPassword,
          },
        })
        .json()

      const { error: loginError } = await signIn(values.email, values.password)

      if (loginError) {
        setError(loginError.message ?? t("errorMessages.generalError"))
      }
    } catch (err) {
      const errorMessage = await extractErrorMessage(err)
      setError(errorMessage)
    }
  }

  return (
    <div className="mx-auto w-full max-w-md">
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-4"
        >
          <FormField
            control={form.control}
            name="firstName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("firstName")}</FormLabel>
                <FormControl>
                  <Input
                    type="text"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="surname"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("surname")}</FormLabel>
                <FormControl>
                  <Input
                    type="text"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("email")}</FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("password")}</FormLabel>
                <FormControl>
                  <PasswordInput {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="confirmPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("confirmPassword")}</FormLabel>
                <FormControl>
                  <PasswordInput {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="acceptPrivacy"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start gap-2 rounded-lg border border-border/80 bg-muted/30 p-3 dark:bg-muted/20">
                <FormControl>
                  <Checkbox
                    className="mt-0.5 shrink-0"
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <div className="min-w-0 flex-1">
                  <FormLabel className="!mt-0 !block w-full min-w-0 cursor-pointer text-left leading-snug !font-normal">
                    <span className="block text-xs leading-snug text-pretty sm:text-sm">
                      {t.rich("privacyConsentLine1", {
                        privacy: (chunks) => (
                          <Link
                            href={ROUTES.privacy}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline font-medium text-primary underline underline-offset-2"
                          >
                            {chunks}
                          </Link>
                        ),
                      })}
                    </span>
                    <span className="mt-1 block text-xs leading-snug text-pretty text-muted-foreground sm:text-sm">
                      {t("privacyConsentLine2")}
                    </span>
                  </FormLabel>
                  <FormMessage className="pt-0.5" />
                </div>
              </FormItem>
            )}
          />

          <Button
            type="submit"
            className="w-full"
            disabled={form.formState.isSubmitting}
          >
            {form.formState.isSubmitting ? t("submitButton") + "..." : t("submitButton")}
          </Button>

          {error && (
            <div
              className={cn(
                "flex items-start gap-2 rounded-lg border border-destructive/50 bg-destructive/10 p-4",
              )}
            >
              <AlertCircleIcon className="mt-0.5 size-5 shrink-0 text-destructive" />
              <Typography
                as="p"
                variant="body-sm"
                className="text-destructive"
              >
                {error}
              </Typography>
            </div>
          )}
        </form>
      </Form>
    </div>
  )
}
