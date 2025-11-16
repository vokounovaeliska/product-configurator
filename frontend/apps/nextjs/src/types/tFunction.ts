import type { Messages, NamespaceKeys, useTranslations } from "next-intl"

type AllKeys<T> = T extends object ? { [K in keyof T]: K | AllKeys<T[K]> }[keyof T] : never

type AllMessageKeys = AllKeys<Messages>

export type TFunction<T extends NamespaceKeys<Messages, AllMessageKeys>> = ReturnType<
  typeof useTranslations<T>
>
