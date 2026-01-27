export const ROUTES = {
  home: "/",
  login: "/login",
  registration: "/registration",
  setup: "/setup",
  setupProductModels: "/setup/product-models",
  setupComponents: (productModelId: string) => `/setup/product-models/${productModelId}/components`,
  configurator: (productModelId: string) => `/configurator/${productModelId}`,
} as const
