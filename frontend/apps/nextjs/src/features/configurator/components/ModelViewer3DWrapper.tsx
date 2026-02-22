"use client"

import { useTranslations } from "next-intl"
import dynamic from "next/dynamic"

const ModelViewer3D = dynamic(() => import("./ModelViewer3D").then(({ ModelViewer3D: M }) => M), {
  ssr: false,
  loading: () => <ModelViewer3DLoading />,
})

function ModelViewer3DLoading() {
  const t = useTranslations("Configurator.preview")
  return (
    <div className="flex h-full min-h-[40vh] items-center justify-center rounded-lg border bg-muted/30">
      <span className="text-muted-foreground">{t("loading3d")}</span>
    </div>
  )
}

export { ModelViewer3D }
