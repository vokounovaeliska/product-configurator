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

import { getLoginFormSchema, type LoginSchema } from "@/features/auth/schemas/loginFormSchema"

export const SignInForm = () => {
  const [error, setError] = useState<string | null>(null)

  const t = useTranslations("Login")
  const { signIn } = useAuth()

  const loginFormSchema = getLoginFormSchema(t)

  const form = useForm({
    defaultValues: {
      email: "",
      password: "",
      rememberMe: false,
    },
    resolver: zodResolver(loginFormSchema),
  })

  const onSubmit = async (values: LoginSchema) => {
    setError(null)
    const { error } = await signIn(values.email, values.password, values.rememberMe)

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
            name="rememberMe"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center space-y-0 space-x-2">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <FormLabel>{t("rememberMe")}</FormLabel>
              </FormItem>
            )}
          />
          <Button
            type="submit"
            className="w-full"
            disabled={form.formState.isSubmitting}
          >
            {form.formState.isSubmitting ? t("loginButton") + "..." : t("loginButton")}
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
