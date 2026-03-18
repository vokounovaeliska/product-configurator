"use client"

import { useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { AlertCircleIcon } from "lucide-react"
import { useTranslations } from "next-intl"
import { useForm } from "react-hook-form"
import { Button } from "@workspace/ui/components/button"
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
    },
    resolver: zodResolver(registrationFormSchema),
  })

  const onSubmit = async (values: RegistrationSchema) => {
    setError(null)

    try {
      // Register the user
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

      // Auto-login after successful registration
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
    <div className="mx-auto max-w-md py-8">
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
