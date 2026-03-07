export const ROUTES = {
  home: "/",
  login: "/login",
  registration: "/registration",
  setup: "/setup",
  setupProductModels: "/setup/product-models",
  setupImportSketchup: "/setup/import/sketchup",
  setupComponents: (productModelId: string) => `/setup/product-models/${productModelId}/components`,
  setupAttributes: (productModelId: string, componentId: string) =>
    `/setup/product-models/${productModelId}/components/${componentId}/attributes`,
  setupAttributeOptions: (productModelId: string, componentId: string, attributeId: string) =>
    `/setup/product-models/${productModelId}/components/${componentId}/attributes/${attributeId}/options`,
  setupAttributePricing: (productModelId: string, componentId: string, attributeId: string) =>
    `/setup/product-models/${productModelId}/components/${componentId}/attributes/${attributeId}/pricing`,
  setupPricingRules: (productModelId: string) =>
    `/setup/product-models/${productModelId}/pricing-rules`,
  configurator: (productModelId: string) => `/configurator/${productModelId}`,
  /** Embed URL: /e/{url} – globally unique when published */
  embed: (url: string) => `/e/${url}`,
  setupCustomerRequests: "/setup/customer-requests",
  setupCustomerRequestDetail: (id: string) => `/setup/customer-requests/${id}`,
} as const
