"use client"

import { Skeleton } from "@workspace/ui/components/skeleton"

import { useProductModel } from "@/features/productModels/api/productModelQueries"
import { PublishProductModelCard } from "@/features/productModels/components/PublishProductModelCard"

type Props = {
  productModelId: string
}

export const PublishPageContent = ({ productModelId }: Props) => {
  const { data: productModel, isLoading } = useProductModel(productModelId)

  if (isLoading || !productModel) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-48 w-full rounded-lg" />
      </div>
    )
  }

  return <PublishProductModelCard productModel={productModel} />
}
