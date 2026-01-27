export const ROUTES = {
  home: "/",
  login: "/login",
  registration: "/registration",
  setup: "/setup",
  setupProductModels: "/setup/product-models",
  setupComponents: (productModelId: string) => `/setup/product-models/${productModelId}/components`,
  setupAttributes: (productModelId: string, componentId: string) =>
    `/setup/product-models/${productModelId}/components/${componentId}/attributes`,
  configurator: (productModelId: string) => `/configurator/${productModelId}`,
} as const
