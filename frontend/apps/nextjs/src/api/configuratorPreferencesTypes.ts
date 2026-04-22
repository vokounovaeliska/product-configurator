export type QuoteRequestEmailTemplatePreset = "en" | "cs" | "custom"

export type SavedCameraAngles = {
  cameraHorizontalAngleRad: number
  cameraVerticalAngleRad: number
}

export type CameraAnglesGetter = () => SavedCameraAngles | null

export type ConfiguratorPreferencesDto = {
  zoomDistanceDefault: number | null
  zoomDistanceEmbed: number | null
  embedShowProductName: boolean | null
  embedShowDescription: boolean | null
  embedShowComponents: boolean | null
  backgroundPreset: string | null
  cameraHorizontalAngleRad: number | null
  cameraVerticalAngleRad: number | null
}

export type ConfiguratorPreferencesPatchDto = {
  zoomDistanceDefault?: number | null
  zoomDistanceEmbed?: number | null
  embedShowProductName?: boolean | null
  embedShowDescription?: boolean | null
  embedShowComponents?: boolean | null
  backgroundPreset?: string | null
  cameraHorizontalAngleRad?: number | null
  cameraVerticalAngleRad?: number | null
  clearSavedCameraAngles?: boolean | null
}
