"use client"

import { useCallback, useRef, useState } from "react"
import { UploadIcon } from "lucide-react"
import Image from "next/image"
import { Button } from "@workspace/ui/components/button"
import { Label } from "@workspace/ui/components/label"
import { Typography } from "@workspace/ui/components/typography"

import { api } from "@/lib/api/restClient"
import { getImageUrl } from "@/utils/imageUrl"

type Props = {
  /** Current image URL (relative or absolute) for preview; after upload this is the new relative URL */
  value?: string | null
  onUploaded: (relativeUrl: string) => void
  onError?: (message: string) => void
  accept?: string
  label?: string
  isDisabled?: boolean
}

const DEFAULT_ACCEPT = "image/jpeg,image/png,image/gif,image/webp,image/svg+xml"

export const ImageUpload = ({
  value,
  onUploaded,
  onError,
  accept = DEFAULT_ACCEPT,
  label,
  isDisabled = false,
}: Props) => {
  const inputRef = useRef<HTMLInputElement>(null)
  const [isUploading, setIsUploading] = useState(false)

  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (!file) return

      setIsUploading(true)
      onError?.("")
      try {
        const formData = new FormData()
        formData.append("file", file)

        const response = await api
          .post("api/v1/files/upload", { body: formData })
          .json<{ success: boolean; message: string; url: string | null }>()

        if (response.success && response.url) {
          onUploaded(response.url)
        } else {
          onError?.(response.message ?? "Upload failed")
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : "Upload failed"
        onError?.(message)
      } finally {
        setIsUploading(false)
        e.target.value = ""
      }
    },
    [onUploaded, onError],
  )

  const displayUrl = value ? getImageUrl(value) : null

  return (
    <div className="space-y-2">
      {label && <Label className="text-muted-foreground">{label}</Label>}
      <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center">
        {displayUrl ? (
          <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-lg border bg-muted">
            <Image
              src={displayUrl}
              alt="Preview"
              fill
              className="object-contain"
              sizes="96px"
            />
          </div>
        ) : (
          <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-lg border border-dashed bg-muted">
            <UploadIcon className="size-8 text-muted-foreground" />
          </div>
        )}
        <div className="flex flex-col gap-1">
          <input
            ref={inputRef}
            type="file"
            accept={accept}
            className="hidden"
            onChange={handleFileChange}
            disabled={isDisabled || isUploading}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => inputRef.current?.click()}
            disabled={isDisabled || isUploading}
          >
            {isUploading ? (
              <Typography
                as="span"
                variant="body-sm"
              >
                Uploading…
              </Typography>
            ) : value ? (
              <Typography
                as="span"
                variant="body-sm"
              >
                Change image
              </Typography>
            ) : (
              <Typography
                as="span"
                variant="body-sm"
              >
                Upload image
              </Typography>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
