"use client"

import type { MutableRefObject } from "react"
import { useCallback, useEffect, useState } from "react"
import { InfoIcon } from "lucide-react"
import { useTranslations } from "next-intl"
import { Button } from "@workspace/ui/components/button"
import { Label } from "@workspace/ui/components/label"
import { Tooltip } from "@workspace/ui/components/tooltip"
import { Typography } from "@workspace/ui/components/typography"

import {
  useConfiguratorPreferences,
  usePatchConfiguratorPreferences,
} from "@/api/configuratorPreferencesQueries"
import type { CameraAnglesGetter } from "@/api/configuratorPreferencesTypes"
import { extractErrorMessage } from "@/lib/utils"

/** ~0.25° — live orbit vs stored floats may differ slightly */
const ANGLE_MATCH_EPS_RAD = 0.005

type Props = {
  productModelId: string
  cameraAnglesGetterRef: MutableRefObject<CameraAnglesGetter | null>
  hasSavedCameraAngles: boolean
  helpTooltip: string
  className?: string
}

export function PreviewCameraAngleControls({
  productModelId,
  cameraAnglesGetterRef,
  hasSavedCameraAngles,
  helpTooltip,
  className,
}: Props) {
  const t = useTranslations("Configurator.previewSettings")
  const [cameraError, setCameraError] = useState<string | null>(null)
  const { data: preferences } = useConfiguratorPreferences(productModelId)
  const patchPreferences = usePatchConfiguratorPreferences(productModelId)

  const savedH = preferences?.cameraHorizontalAngleRad ?? null
  const savedV = preferences?.cameraVerticalAngleRad ?? null

  const [isLiveAngleReady, setIsLiveAngleReady] = useState(false)
  const [isLiveMatchingSaved, setIsLiveMatchingSaved] = useState(false)

  useEffect(() => {
    const tick = () => {
      const getter = cameraAnglesGetterRef.current
      if (!getter) {
        setIsLiveAngleReady(false)
        setIsLiveMatchingSaved(false)
        return
      }
      const live = getter()
      if (!live) {
        setIsLiveAngleReady(false)
        setIsLiveMatchingSaved(false)
        return
      }
      setIsLiveAngleReady(true)
      if (savedH == null || savedV == null) {
        setIsLiveMatchingSaved(false)
        return
      }
      const isAngleMatch =
        Math.abs(live.cameraHorizontalAngleRad - savedH) < ANGLE_MATCH_EPS_RAD &&
        Math.abs(live.cameraVerticalAngleRad - savedV) < ANGLE_MATCH_EPS_RAD
      setIsLiveMatchingSaved(isAngleMatch)
    }
    tick()
    const id = window.setInterval(tick, 120)
    return () => clearInterval(id)
  }, [savedH, savedV, cameraAnglesGetterRef])

  const isSaveDisabled = patchPreferences.isPending || !isLiveAngleReady || isLiveMatchingSaved

  const handleSaveCameraAngles = useCallback(() => {
    setCameraError(null)
    const getter = cameraAnglesGetterRef.current
    if (!getter) {
      setCameraError(t("cameraNotReady"))
      return
    }
    const angles = getter()
    if (!angles) {
      setCameraError(t("cameraNotReady"))
      return
    }
    patchPreferences.mutate(
      {
        cameraHorizontalAngleRad: angles.cameraHorizontalAngleRad,
        cameraVerticalAngleRad: angles.cameraVerticalAngleRad,
      },
      {
        onError: (error) => {
          void extractErrorMessage(error).then(setCameraError)
        },
      },
    )
  }, [cameraAnglesGetterRef, patchPreferences, t])

  const handleResetCameraAngles = useCallback(() => {
    setCameraError(null)
    patchPreferences.mutate(
      { clearSavedCameraAngles: true },
      {
        onError: (error) => {
          void extractErrorMessage(error).then(setCameraError)
        },
      },
    )
  }, [patchPreferences])

  return (
    <div className={className ?? "space-y-2 border-t border-border/60 pt-3"}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <Label className="text-sm font-medium">{t("cameraLabel")}</Label>
          <Tooltip>
            <Tooltip.Trigger asChild>
              <button
                type="button"
                className="rounded p-0.5 text-muted-foreground hover:text-foreground"
                aria-label={t("moreInfoAria")}
              >
                <InfoIcon className="size-3.5 shrink-0" />
              </button>
            </Tooltip.Trigger>
            <Tooltip.Content
              side="top"
              className="max-w-xs text-left"
            >
              {helpTooltip}
            </Tooltip.Content>
          </Tooltip>
        </div>
        {hasSavedCameraAngles && (
          <span className="rounded-full border border-border/80 bg-muted/40 px-2 py-0.5 text-[11px] leading-none font-medium text-muted-foreground">
            {t("anglesBadgeSaved")}
          </span>
        )}
      </div>
      <div className="flex flex-wrap items-center gap-2 pt-0.5">
        <Button
          type="button"
          size="sm"
          onClick={handleSaveCameraAngles}
          disabled={isSaveDisabled}
          title={isLiveMatchingSaved ? t("saveCameraAnglesSameTitle") : undefined}
        >
          {patchPreferences.isPending ? t("saving") : t("saveCameraAngles")}
        </Button>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          className="text-muted-foreground hover:text-foreground"
          onClick={handleResetCameraAngles}
          disabled={patchPreferences.isPending || !hasSavedCameraAngles}
        >
          {t("resetCameraAngles")}
        </Button>
      </div>
      {cameraError && (
        <Typography
          as="p"
          variant="body-sm"
          className="text-destructive"
        >
          {cameraError}
        </Typography>
      )}
    </div>
  )
}
