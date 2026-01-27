export const raiseError = (message?: string): never => {
  throw new Error(message ?? "Unhandled uknown error")
}

/**
 * Extracts a user-friendly error message from a ky HTTPError
 */
export const extractErrorMessage = async (error: unknown): Promise<string> => {
  if (error instanceof Error && "response" in error) {
    const httpError = error as { response: Response }
    const status = httpError.response.status

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
      // If JSON parsing fails, fall back to status-based messages
      // Don't return raw status text or technical error messages
    }

    // Return user-friendly messages based on HTTP status codes
    switch (status) {
      case 401:
        return "Invalid email or password. Please check your credentials and try again."
      case 403:
        return "You don't have permission to perform this action."
      case 404:
        return "The requested resource was not found."
      case 422:
        return "The provided data is invalid. Please check your input."
      case 429:
        return "Too many requests. Please try again later."
      case 500:
      case 502:
      case 503:
      case 504:
        return "Server error. Please try again later."
      default:
        return httpError.response.statusText || "An unexpected error occurred"
    }
  }

  if (error instanceof Error) {
    // Check if it's a ky HTTPError with status code in message
    const statusMatch = /status code (\d+)/.exec(error.message)
    if (statusMatch) {
      const status = Number.parseInt(statusMatch[1] ?? "0", 10)
      switch (status) {
        case 401:
          return "Invalid email or password. Please check your credentials and try again."
        case 403:
          return "You don't have permission to perform this action."
        case 404:
          return "The requested resource was not found."
        case 422:
          return "The provided data is invalid. Please check your input."
        case 429:
          return "Too many requests. Please try again later."
        case 500:
        case 502:
        case 503:
        case 504:
          return "Server error. Please try again later."
      }
    }
    return error.message
  }

  return "An unexpected error occurred"
}
