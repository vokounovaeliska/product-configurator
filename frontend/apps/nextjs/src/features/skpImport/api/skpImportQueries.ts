import { useMutation, useQueryClient } from "@tanstack/react-query"

import { api } from "@/lib/api/restClient"
import { extractErrorMessage } from "@/lib/utils"

/* eslint-disable-next-line import/no-restricted-paths -- skpImport invalidates product model list */
import { productModelKeys } from "@/features/productModels/api/productModelQueries"

export type SkpImportResponse = {
  success: boolean
  productModelId: string | null
  error: string | null
}

export const useSkpImport = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      configuratorZip,
      productName,
    }: {
      configuratorZip: File
      productName?: string
    }): Promise<SkpImportResponse> => {
      try {
        const formData = new FormData()
        formData.append("configuratorZip", configuratorZip)
        if (productName?.trim()) {
          formData.append("name", productName.trim())
        }

        const response = await api.post("products/api/v1/import/sketchup", {
          body: formData,
        })

        return response.json<SkpImportResponse>()
      } catch (error) {
        const message = await extractErrorMessage(error)
        throw new Error(message)
      }
    },
    onSuccess: (data) => {
      if (data.success) {
        void queryClient.invalidateQueries({ queryKey: productModelKeys.lists() })
      }
    },
  })
}
