export const raiseError = (message?: string): never => {
  throw new Error(message ?? "Unhandled uknown error")
}

export type ApiErrorDetail = {
  message: string
  field?: string | null
  code?: string | null
}

/**
 * Reads validation/API error body from a ky HTTPError (uses clone so the response body can still be read elsewhere).
 */
export async function parseApiErrorDetail(error: unknown): Promise<ApiErrorDetail | null> {
  if (!(error instanceof Error) || !("response" in error)) return null
  const httpError = error as { response: Response }
  try {
    const errorData = (await httpError.response.clone().json()) as
      | {
          errors?: { message?: string; field?: string | null; code?: string | null }[]
          message?: string
        }
      | null
      | undefined

    if (errorData) {
      if (errorData.errors && errorData.errors.length > 0) {
        const firstError = errorData.errors[0]
        if (firstError?.message) {
          return {
            message: firstError.message,
            field: firstError.field,
            code: firstError.code,
          }
        }
      }
      if (errorData.message) {
        return { message: errorData.message }
      }
    }
  } catch {
    // fall through
  }
  return null
}

/**
 * Attaches optional API `field` / `code` for UI that maps errors to inputs (e.g. duplicate embed URL).
 */
export function errorWithApiDetail(detail: ApiErrorDetail): Error & {
  field?: string | null
  code?: string | null
} {
  const err = new Error(detail.message) as Error & { field?: string | null; code?: string | null }
  err.field = detail.field
  err.code = detail.code
  return err
}

/**
 * Extracts a user-friendly error message from a ky HTTPError
 */
export const extractErrorMessage = async (error: unknown): Promise<string> => {
  const fromBody = await parseApiErrorDetail(error)
  if (fromBody) return fromBody.message

  if (error instanceof Error && "response" in error) {
    const httpError = error as { response: Response }
    const status = httpError.response.status

    // Return user-friendly messages based on HTTP status codes
    switch (status) {
      case 401:
        return "Invalid credentials."
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
          return "Invalid credentials."
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
    // Map network/connection errors to a user-friendly message
    const msg = error.message.toLowerCase()
    if (msg === "failed to fetch" || msg.includes("network") || msg.includes("connection")) {
      return "Unable to connect. Please check your connection and try again."
    }
    return error.message
  }

  return "An unexpected error occurred"
}

/**
 * Converts a label (display name) to a code suitable for option value.
 * Lowercase, diacritics removed, spaces/special chars → underscore.
 */
export const labelToCode = (label: string): string =>
  label
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "")
