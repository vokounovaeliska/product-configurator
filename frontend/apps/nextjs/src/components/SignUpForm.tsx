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

import { useAuth } from "@/hooks/useAuth"
import {
  getRegistrationFormSchema,
  type RegistrationSchema,
} from "@/schemas/registrationFormSchema"

export const SignUpForm = () => {
  const [error, setError] = useState<string | null>(null)

  const t = useTranslations("Registration")
  const { signUp } = useAuth()

  const registrationFormSchema = getRegistrationFormSchema(t)

  const form = useForm({
    defaultValues: {
      name: "",
      email: "",
      password: "",
    },
    resolver: zodResolver(registrationFormSchema),
  })

  const onSubmit = async (values: RegistrationSchema) => {
    setError(null)
    const { error } = await signUp(values.email, values.password, values.name)

    if (error) {
      setError(error.message ?? t("errorMessages.generalError"))
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
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("name")}</FormLabel>
                <FormControl>
                  <Input
                    type="name"
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

          <Button
            type="submit"
            className="w-full"
          >
            {t("loginButton")}
          </Button>

          {error && <div className="text-red-500">{error}</div>}
        </form>
      </Form>
    </div>
  )
}
