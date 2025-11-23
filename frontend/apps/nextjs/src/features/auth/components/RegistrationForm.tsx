"use client"

import { useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
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

import { env } from "@/config/env"
import { useAuth } from "@/hooks/useAuth"

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
      const response = await fetch(
        `${env.NEXT_PUBLIC_REST_API_URL}/users/api/v1/auth/public/register`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            firstName: values.firstName,
            surname: values.surname,
            email: values.email,
            password: values.password,
            confirmPassword: values.confirmPassword,
          }),
        },
      )

      if (!response.ok) {
        let errorMessage = t("errorMessages.generalError")

        try {
          const errorData = (await response.json()) as { message?: string } | null | undefined

          if (
            errorData &&
            typeof errorData === "object" &&
            "message" in errorData &&
            typeof errorData.message === "string"
          ) {
            errorMessage = errorData.message ?? t("errorMessages.generalError")
          }
        } catch {
          // Ignore JSON parsing errors and fall back to generic message
        }

        throw new Error(errorMessage)
      }

      // Auto-login after successful registration
      const { error: loginError } = await signIn(values.email, values.password)

      if (loginError) {
        throw new Error(loginError.message ?? t("errorMessages.generalError"))
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t("errorMessages.generalError"))
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
                  <Input
                    type="password"
                    {...field}
                  />
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
                  <Input
                    type="password"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button
            type="submit"
            className="w-full"
          >
            {t("submitButton")}
          </Button>

          {error && <div className="rounded-lg bg-red-50 p-4 text-red-800">{error}</div>}
        </form>
      </Form>
    </div>
  )
}
