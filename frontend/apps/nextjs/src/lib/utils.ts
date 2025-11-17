export const raiseError = (message?: string): never => {
  throw new Error(message ?? "Unhandled uknown error")
}
