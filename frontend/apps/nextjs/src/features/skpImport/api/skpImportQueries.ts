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
      skpFile,
      glbFile,
      productName,
      parametersJson,
      parametersZip,
    }: {
      skpFile?: File
      glbFile: File
      productName?: string
      parametersJson?: File | null
      parametersZip?: File | null
    }): Promise<SkpImportResponse> => {
      try {
        const formData = new FormData()
        if (skpFile) formData.append("skp", skpFile)
        formData.append("glb", glbFile)
        if (productName?.trim()) {
          formData.append("name", productName.trim())
        }
        if (parametersJson) {
          formData.append("parametersJson", parametersJson)
        }
        if (parametersZip) {
          formData.append("parametersZip", parametersZip)
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
