export type ConfiguratorPreferencesDto = {
  zoomDistanceDefault: number | null
  zoomDistanceEmbed: number | null
  embedShowProductName: boolean | null
  embedShowDescription: boolean | null
  embedShowComponents: boolean | null
  backgroundPreset: string | null
}

export type ConfiguratorPreferencesPatchDto = {
  zoomDistanceDefault?: number | null
  zoomDistanceEmbed?: number | null
  embedShowProductName?: boolean | null
  embedShowDescription?: boolean | null
  embedShowComponents?: boolean | null
  backgroundPreset?: string | null
}
