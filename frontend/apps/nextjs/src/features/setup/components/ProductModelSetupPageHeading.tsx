"use client"

import { useTranslations } from "next-intl"
import { Skeleton } from "@workspace/ui/components/skeleton"
import { Typography } from "@workspace/ui/components/typography"

/* eslint-disable import/no-restricted-paths -- setup page heading loads product model like ModelSetupUnified */
import { useProductModel } from "@/features/productModels/api/productModelQueries"

/* eslint-enable import/no-restricted-paths */

type Props = {
  productModelId: string
  /** When the RSC fetch succeeded, show the name immediately (avoids flash). */
  initialName?: string
}

export const ProductModelSetupPageHeading = ({ productModelId, initialName }: Props) => {
  const t = useTranslations("Components")
  const { data, isLoading } = useProductModel(productModelId)
  const name = data?.name ?? initialName
  const shouldShowSkeleton = isLoading && !name

  return (
    <div className="mb-6">
      {shouldShowSkeleton ? (
        <Skeleton className="mb-2 h-10 w-full max-w-md" />
      ) : (
        <Typography
          as="h1"
          variant="display-3xl"
          weight="bold"
          className="mb-2"
        >
          {name ? t("titleWithProduct", { name }) : t("title")}
        </Typography>
      )}
      <Typography
        as="p"
        variant="body-lg"
        className="text-muted-foreground"
      >
        {t("description")}
      </Typography>
    </div>
  )
}
