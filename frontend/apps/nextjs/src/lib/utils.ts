export const raiseError = (message?: string): never => {
  throw new Error(message ?? "Unhandled uknown error")
}

/**
 * Extracts a user-friendly error message from a ky HTTPError
 */
export const extractErrorMessage = async (error: unknown): Promise<string> => {
  if (error instanceof Error && "response" in error) {
    const httpError = error as { response: Response }
    try {
      const errorData = (await httpError.response.json()) as
        | { errors?: { message?: string }[]; message?: string }
        | null
        | undefined

      if (errorData) {
        // Try to get message from errors array (validation errors)
        if (errorData.errors && errorData.errors.length > 0) {
          const firstError = errorData.errors[0]
          if (firstError?.message) {
            return firstError.message
          }
        }

        // Try to get message from top level
        if (errorData.message) {
          return errorData.message
        }
      }
    } catch {
      // If JSON parsing fails, fall back to status text or error message
      return httpError.response.statusText || error.message
    }
  }

  if (error instanceof Error) {
    return error.message
  }

  return "An unexpected error occurred"
}
