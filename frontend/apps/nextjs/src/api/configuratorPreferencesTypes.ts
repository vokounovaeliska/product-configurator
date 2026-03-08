export type ConfiguratorPreferencesDto = {
  zoomDistanceDefault: number | null
  zoomDistanceEmbed: number | null
  embedShowProductName: boolean | null
  embedShowDescription: boolean | null
  embedShowComponents: boolean | null
}

export type ConfiguratorPreferencesPatchDto = {
  zoomDistanceDefault?: number | null
  zoomDistanceEmbed?: number | null
  embedShowProductName?: boolean | null
  embedShowDescription?: boolean | null
  embedShowComponents?: boolean | null
}
